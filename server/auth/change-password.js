// ============================================================
//  Tales Hero Indonesia — Ubah Kata Sandi
//  POST /auth/change-password
//
//  Body JSON: { username, secAnswer, newPassword }
//  Memverifikasi jawaban keamanan lalu update fdPassword.
// ============================================================

import crypto from 'node:crypto';
import { query } from '../db.js';

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

async function changePassword(req, res) {
  try {
    const { username, secAnswer, newPassword } = req.body ?? {};

    if (!username || !secAnswer || !newPassword)
      return res.status(400).json({ message: 'Semua field wajib diisi.' });

    if (newPassword.length < 8 || newPassword.length > 50)
      return res.status(400).json({ message: 'Kata sandi baru harus 8–50 karakter.' });

    // ── 1. Verifikasi jawaban keamanan ────────────────────
    const answerHash = sha256(secAnswer.trim().toLowerCase());
    const rows = await query(
      'SELECT username FROM tales_hero_web_users WHERE username = ? AND sec_answer_hash = ? LIMIT 1',
      [username.trim(), answerHash],
    );

    if (rows.length === 0)
      return res.status(401).json({ message: 'Jawaban keamanan salah.' });

    // ── 2. Update password di tabel game ─────────────────
    const newPassHash = crypto.createHash('md5').update(newPassword, 'utf8').digest('hex');
    await query(
      'UPDATE userinfofrompublisher SET fdPassword = ? WHERE fdUserID = ?',
      [newPassHash, username.trim()],
    );

    return res.status(200).json({ message: 'Kata sandi berhasil diubah.' });

  } catch (err) {
    console.error('[change-password] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

export default changePassword;
