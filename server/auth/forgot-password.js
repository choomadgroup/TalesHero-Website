// POST /auth/forgot-password
// Kirim link reset kata sandi ke email pengguna.
// Input: username game ATAU alamat email — sistem cari sendiri email terdaftar.

import crypto from 'node:crypto';
import { query } from '../db.js';
import { sendPasswordResetEmail } from '../mailer.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function forgotPassword(req, res) {
  try {
    const { identifier, captcha } = req.body ?? {};
    const value = identifier?.trim();
    if (!value) {
      return res.status(400).json({ message: 'Username game atau email wajib diisi.' });
    }
    if (!await verifyRecaptcha(captcha, req.ip)) return captchaError(res);

    // Cari akun berdasarkan username game ATAU email terdaftar
    let rows;
    if (isEmail(value)) {
      rows = await query(
        `SELECT g.fdUserID AS username, w.email
         FROM userinfofrompublisher g
         LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
         WHERE LOWER(w.email) = ?
         LIMIT 1`,
        [value.toLowerCase()],
      );
    } else {
      rows = await query(
        `SELECT g.fdUserID AS username, w.email
         FROM userinfofrompublisher g
         LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
         WHERE g.fdUserID = ?
         LIMIT 1`,
        [value],
      );
    }

    if (rows.length === 0 || !rows[0].email) {
      return res.status(404).json({ message: 'Akun tidak ditemukan. Pastikan username atau email yang dimasukkan sudah benar.' });
    }

    const { username, email } = rows[0];

    // Hapus token lama yang belum digunakan
    await query(
      `DELETE FROM password_reset_tokens WHERE username = ? AND type = 'password'`,
      [username],
    );

    // Buat token baru
    const token     = crypto.randomBytes(32).toString('hex');
    await query(
      `INSERT INTO password_reset_tokens (username, token, type, expires_at)
       VALUES (?, ?, 'password', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [username, token],
    );

    await sendPasswordResetEmail(email, username, token);

    return res.status(200).json({
      message    : 'Jika akun terdaftar, link reset sudah dikirim.',
      maskedEmail: maskEmail(email),
    });
  } catch (err) {
    console.error('[forgot-password] error:', err);
    return res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' });
  }
}

export default forgotPassword;
