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

import bcrypt from 'bcryptjs';
import { query } from '../db.js';

const SALT_ROUNDS = 12;

const ALLOWED_QUESTIONS = [
  'Nama hewan kesayangan kamu?',
  'Warna apa yang kamu suka?',
  'Apa nama panggilan kamu?',
];

/**
 * Validasi sederhana di sisi server.
 * @param {object} body
 * @returns {string|null} Pesan error, atau null jika valid
 */
function validate(body) {
  const { username, email, password, secQuestion, secAnswer } = body;

  if (!username || username.trim().length < 3 || username.trim().length > 24)
    return 'Username harus antara 3–24 karakter.';
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
    return 'Username hanya boleh huruf, angka, dan underscore.';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Format email tidak valid.';

  if (!password || password.length < 8)
    return 'Kata sandi minimal 8 karakter.';

  if (!secQuestion || !ALLOWED_QUESTIONS.includes(secQuestion))
    return 'Pertanyaan keamanan tidak valid.';

  if (!secAnswer || secAnswer.trim().length === 0)
    return 'Jawaban pertanyaan keamanan wajib diisi.';

  return null;
}

/**
 * Express route handler untuk registrasi akun baru.
 */
async function register(req, res) {
  try {
    const { username, email, password, secQuestion, secAnswer } = req.body ?? {};

    // ── 1. Validasi input ─────────────────────────────────
    const validationError = validate(req.body ?? {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // ── 2. Cek username & email sudah terdaftar ───────────
    const existing = await query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim().toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username atau email sudah terdaftar.' });
    }

    // ── 3. Hash password & jawaban keamanan ───────────────
    const [passwordHash, secAnswerHash] = await Promise.all([
      bcrypt.hash(password, SALT_ROUNDS),
      bcrypt.hash(secAnswer.trim().toLowerCase(), SALT_ROUNDS),
    ]);

    // ── 4. Simpan ke database ─────────────────────────────
    await query(
      `INSERT INTO users (username, email, password_hash, sec_question, sec_answer)
       VALUES (?, ?, ?, ?, ?)`,
      [
        username.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        secQuestion,
        secAnswerHash,
      ]
    );

    // ── 5. Berhasil ───────────────────────────────────────
    return res.status(201).json({ message: 'Akun berhasil dibuat.' });

  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  }
}

export default register;
