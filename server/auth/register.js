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

  if (!password || password.length < 8 || password.length > 50)
    return 'Kata sandi harus antara 8–50 karakter.';

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
  const conn = await pool.getConnection();
  try {
    const { username, email, password, secQuestion, secAnswer } = req.body ?? {};
    const normalizedEmail = email?.trim().toLowerCase();

    // ── 1. Validasi input ─────────────────────────────────
    const validationError = validate(req.body ?? {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // ── 2. Cek username sudah terdaftar di akun game ──────
    await conn.beginTransaction();

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

    // ── 3. Simpan langsung ke tabel publisher game ────────
    // The game server expects a lowercase MD5 digest in fdPassword.
    await conn.query(
      `INSERT INTO userinfofrompublisher (fdUserID, fdGameID, fdPassword)
       VALUES (?, NULL, ?)`,
      [username.trim(), gamePassword(password)]
    );

    // ── 4. Simpan data website (email, pertanyaan keamanan) ──
    await conn.query(
      `INSERT INTO tales_hero_web_users (username, email, sec_question, sec_answer_hash, sec_answer)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email           = VALUES(email),
         sec_question    = VALUES(sec_question),
         sec_answer_hash = VALUES(sec_answer_hash),
         sec_answer      = VALUES(sec_answer)`,
      [
        username.trim(),
        normalizedEmail,
        secQuestion,
        sha256(secAnswer.trim().toLowerCase()),
        secAnswer.trim(),
      ],
    );

    await conn.commit();
    return res.status(201).json({
      message: 'Akun game berhasil dibuat. Email dan pertanyaan keamanan sudah tersimpan.',
    });

  } catch (err) {
    try { await conn.rollback(); } catch { /* connection cleanup follows */ }
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email sudah terdaftar dan tidak dapat digunakan kembali.' });
    }
    console.error('[register] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  } finally {
    conn.release();
  }
}

export default register;
