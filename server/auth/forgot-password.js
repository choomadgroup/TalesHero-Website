// POST /auth/forgot-password
// Kirim link reset kata sandi ke email pengguna.

import crypto from 'node:crypto';
import { query } from '../db.js';
import { sendPasswordResetEmail } from '../mailer.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function forgotPassword(req, res) {
  try {
    const { identifier, captcha } = req.body ?? {};
    const id = identifier?.trim();
    const emailId = id?.toLowerCase();
    if (!id) return res.status(400).json({ message: 'Username atau email wajib diisi.' });
    if (!await verifyRecaptcha(captcha, req.ip)) return captchaError(res);

    // Cari user berdasarkan username atau email
    const rows = await query(
      `SELECT g.fdUserID AS username, w.email
       FROM userinfofrompublisher g
       LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE g.fdUserID = ? OR w.email = ?
       LIMIT 1`,
      [id, emailId],
    );

    // Selalu kembalikan 200 agar tidak bisa digunakan untuk mencari akun
    if (rows.length === 0 || !rows[0].email) {
      return res.status(200).json({ message: 'Jika email terdaftar, link reset sudah dikirim.' });
    }

    const { username, email } = rows[0];

    // Hapus token lama yang belum digunakan
    await query(
      `DELETE FROM password_reset_tokens WHERE username = ? AND type = 'password'`,
      [username],
    );

    // Buat token baru
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await query(
      `INSERT INTO password_reset_tokens (username, token, type, expires_at) VALUES (?, ?, 'password', ?)`,
      [username, token, expiresAt],
    );

    await sendPasswordResetEmail(email, username, token);

    return res.status(200).json({ message: 'Jika email terdaftar, link reset sudah dikirim.', maskedEmail: maskEmail(email) });
  } catch (err) {
    console.error('[forgot-password] error:', err);
    return res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' });
  }
}

export default forgotPassword;
