// POST /auth/forgot-security-question
// Kirim link reset pertanyaan keamanan ke email pengguna.

import crypto from 'node:crypto';
import { query } from '../db.js';
import { sendSecurityResetEmail } from '../mailer.js';

async function forgotSecurityQuestion(req, res) {
  try {
    const { identifier } = req.body ?? {};
    const id = identifier?.trim();
    if (!id) return res.status(400).json({ message: 'Username atau email wajib diisi.' });

    const rows = await query(
      `SELECT g.fdUserID AS username, w.email
       FROM userinfofrompublisher g
       LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE g.fdUserID = ? OR w.email = ?
       LIMIT 1`,
      [id, id],
    );

    if (rows.length === 0 || !rows[0].email) {
      return res.status(200).json({ message: 'Jika email terdaftar, link reset sudah dikirim.' });
    }

    const { username, email } = rows[0];

    await query(
      `DELETE FROM password_reset_tokens WHERE username = ? AND type = 'security'`,
      [username],
    );

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (username, token, type, expires_at) VALUES (?, ?, 'security', ?)`,
      [username, token, expiresAt],
    );

    await sendSecurityResetEmail(email, username, token);

    return res.status(200).json({ message: 'Jika email terdaftar, link reset sudah dikirim.' });
  } catch (err) {
    console.error('[forgot-security-question] error:', err);
    return res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' });
  }
}

export default forgotSecurityQuestion;
