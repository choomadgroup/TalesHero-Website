// ============================================================
//  Tales Hero Indonesia — Handler Login
//  POST /auth/login
//
//  Body JSON yang dikirim dari Login.tsx:
//    { username, password, captcha }
//  (field `username` bisa berisi username ATAU email)
//
//  Pasang di Express:
//    const login = require('./auth/login');
//    app.post('/auth/login', express.json(), login);
// ============================================================

const bcrypt = require('bcryptjs');
const { query } = require('../db');

/**
 * Express route handler untuk login.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body ?? {};

    // ── 1. Validasi input dasar ───────────────────────────
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username atau email wajib diisi.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Kata sandi wajib diisi.' });
    }

    // ── 2. Cari user berdasarkan username atau email ──────
    const rows = await query(
      'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), username.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username/email atau kata sandi salah.' });
    }

    const user = rows[0];

    // ── 3. Verifikasi password ────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Username/email atau kata sandi salah.' });
    }

    // ── 4. Berhasil — kembalikan info user ────────────────
    //  Tambahkan session / JWT di sini sesuai kebutuhan server kamu.
    return res.status(200).json({
      message: 'Login berhasil.',
      user: {
        id:       user.id,
        username: user.username,
        email:    user.email,
      },
    });

  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  }
}

module.exports = login;
