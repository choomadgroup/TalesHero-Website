// POST /auth/email-reset-password
// Reset kata sandi menggunakan token dari email.

import crypto from 'node:crypto';
import { query } from '../db.js';

async function emailResetPassword(req, res) {
  try {
    const { token, newPassword } = req.body ?? {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token dan kata sandi baru wajib diisi.' });
    }
    if (newPassword.length < 8 || newPassword.length > 50) {
      return res.status(400).json({ message: 'Kata sandi baru harus 8–50 karakter.' });
    }

    // Cari token yang valid
    const rows = await query(
      `SELECT username, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = ? AND type = 'password'
       LIMIT 1`,
      [token],
    );

    if (rows.length === 0)          return res.status(400).json({ message: 'Link tidak valid atau sudah kadaluarsa.' });
    if (rows[0].used_at)            return res.status(400).json({ message: 'Link ini sudah pernah digunakan.' });
    if (new Date() > new Date(rows[0].expires_at))
                                    return res.status(400).json({ message: 'Link sudah kadaluarsa. Minta link baru.' });

    const { username } = rows[0];

    // Update password (MD5 sesuai sistem game)
    const newPassHash = crypto.createHash('md5').update(newPassword, 'utf8').digest('hex');
    await query(
      'UPDATE userinfofrompublisher SET fdPassword = ? WHERE fdUserID = ?',
      [newPassHash, username],
    );

    // Tandai token sudah digunakan
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token],
    );

    return res.status(200).json({ message: 'Kata sandi berhasil diatur ulang.' });
  } catch (err) {
    console.error('[email-reset-password] error:', err);
    return res.status(500).json({ message: 'Gagal mereset kata sandi. Coba lagi nanti.' });
  }
}

export default emailResetPassword;
