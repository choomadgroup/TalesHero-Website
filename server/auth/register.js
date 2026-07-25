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
import { query } from '../db.js';

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

  if (!username || username.trim().length < 3 || username.trim().length > 50)
    return 'Username harus antara 3–50 karakter.';
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
    return 'Username hanya boleh huruf, angka, dan underscore.';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Format email tidak valid.';

  if (!password || password.length < 8 || password.length > 50)
    return 'Kata sandi harus antara 8–50 karakter.';

  if (!secQuestion || !ALLOWED_QUESTIONS.includes(secQuestion))
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
  try {
    const { username, email, password, secQuestion, secAnswer } = req.body ?? {};

    // ── 1. Validasi input ─────────────────────────────────
    const validationError = validate(req.body ?? {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // ── 2. Cek username sudah terdaftar di akun game ──────
    const existing = await query(
      'SELECT fdUserID FROM userinfofrompublisher WHERE fdUserID = ? LIMIT 1',
      [username.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username sudah terdaftar di game.' });
    }

    // ── 3. Simpan langsung ke tabel publisher game ────────
    // The game server expects a lowercase MD5 digest in fdPassword.
    await query(
      `INSERT INTO userinfofrompublisher (fdUserID, fdGameID, fdPassword)
       VALUES (?, NULL, ?)`,
      [username.trim(), gamePassword(password)]
    );

    // Email and security-question fields remain in the website form for UX
    // compatibility, but are not columns in the game publisher table.
    return res.status(201).json({ message: 'Akun game berhasil dibuat.' });

  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  }
}

export default register;
