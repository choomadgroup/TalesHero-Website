// ============================================================
//  Tales Hero Indonesia — Handler Registrasi
//  POST /auth/register
//
//  Body JSON yang dikirim dari Daftar.tsx:
//    { username, email, password, secQuestion, secAnswer, captcha }
//
//  Pasang di Express:
//    const register = require('./auth/register');
//    app.post('/auth/register', express.json(), register);
// ============================================================

import crypto from 'node:crypto';
import { pool } from '../db.js';
import { ALLOWED_SECURITY_QUESTIONS } from './security-questions.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';
import { registrationRateLimit } from './rate-limit.js';
import { sendRegistrationVerificationEmail } from '../mailer.js';
import { getClientIp } from './client-ip.js';

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * Validasi sederhana di sisi server.
 * @param {object} body
 * @returns {string|null} Pesan error, atau null jika valid
 */
function validate(body) {
  const { username, email, password, secQuestion, secAnswer } = body;

  if (!username || username.trim().length < 3 || username.trim().length > 50)
    return 'Username harus antara 3–50 karakter.';
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
    return 'Username hanya boleh huruf, angka, dan underscore.';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Format email tidak valid.';

  if (
    !password ||
    password.length < 8 ||
    password.length > 50 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  )
    return 'Kata sandi harus 8–50 karakter dan mengandung huruf besar, huruf kecil, angka, serta tanda khusus.';

  if (!secQuestion || !ALLOWED_SECURITY_QUESTIONS.includes(secQuestion))
    return 'Pertanyaan keamanan tidak valid.';

  if (!secAnswer || secAnswer.trim().length === 0)
    return 'Jawaban pertanyaan keamanan wajib diisi.';

  return null;
}

function gamePassword(password) {
  return crypto.createHash('md5').update(password, 'utf8').digest('hex');
}

/**
 * Express route handler untuk registrasi akun baru.
 */
async function register(req, res) {
  let conn;
  try {
    const { username, email, password, secQuestion, secAnswer, captcha } = req.body ?? {};
    const normalizedEmail = email?.trim().toLowerCase();

    // ── 1. Validasi input ─────────────────────────────────
    const validationError = validate(req.body ?? {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    if (!await verifyRecaptcha(captcha, req.ip)) return captchaError(res);

    const rateLimit = registrationRateLimit(req, {
      email: normalizedEmail,
      username: username.trim(),
    });
    if (rateLimit) {
      res.setHeader('Retry-After', String(rateLimit.retryAfter));
      return res.status(429).json({
        message: `Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${Math.ceil(rateLimit.retryAfter / 60)} menit.`,
      });
    }

    conn = await pool.getConnection();

    // ── 2. Simpan sebagai pending — akun game belum dibuat ──
    await conn.beginTransaction();
    await conn.query('DELETE FROM tales_hero_pending_registrations WHERE expires_at <= NOW()');

    const [existing] = await conn.query(
      'SELECT fdUserID FROM userinfofrompublisher WHERE fdUserID = ? LIMIT 1',
      [username.trim()]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'Username sudah terdaftar di game.' });
    }

    const [existingEmail] = await conn.query(
      'SELECT username FROM tales_hero_web_users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );
    if (existingEmail.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'Email sudah terdaftar dan tidak dapat digunakan kembali.' });
    }

    const [pending] = await conn.query(
      `SELECT username, email FROM tales_hero_pending_registrations
       WHERE username = ? OR email = ? LIMIT 1`,
      [username.trim(), normalizedEmail],
    );
    if (pending.length > 0) {
      const sameRequest = pending[0].username === username.trim()
        && pending[0].email === normalizedEmail;
      await conn.rollback();
      return res.status(409).json({
        message: sameRequest
          ? 'Verifikasi email sebelumnya masih berlaku. Periksa inbox atau tunggu sampai link kedaluwarsa.'
          : 'Username atau email sedang dipakai dalam pendaftaran yang belum diverifikasi.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(token);
    await conn.query(
      `INSERT INTO tales_hero_pending_registrations
       (username, email, game_password_hash, sec_question, sec_answer_hash, sec_answer, token_hash, expires_at, created_ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), ?)`,
      [
        username.trim(),
        normalizedEmail,
        gamePassword(password),
        secQuestion,
        sha256(secAnswer.trim().toLowerCase()),
        secAnswer.trim(),
        tokenHash,
        getClientIp(req),
      ],
    );

    await conn.commit();
    conn.release();
    conn = null;

    try {
      await sendRegistrationVerificationEmail(normalizedEmail, username.trim(), token);
    } catch (emailError) {
      // Do not leave an unusable pending registration behind. The user must
      // be able to submit the form again after Resend recovers.
      await pool.query('DELETE FROM tales_hero_pending_registrations WHERE token_hash = ?', [tokenHash]);
      console.warn('[register] verification email temporarily unavailable:', emailError?.message ?? emailError);
      res.setHeader('Retry-After', '30');
      return res.status(503).json({
        message: 'Layanan email sedang sibuk. Data pendaftaran belum dibuat. Silakan coba lagi dalam beberapa saat.',
      });
    }

    return res.status(201).json({
      message: 'Link verifikasi sudah dikirim ke email kamu. Akun game dibuat setelah email berhasil diverifikasi.',
    });

  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch { /* ignore */ } }
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email sudah terdaftar dan tidak dapat digunakan kembali.' });
    }
    console.error('[register] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  } finally {
    if (conn) conn.release();
  }
}

export default register;
