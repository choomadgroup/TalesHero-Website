// POST /auth/forgot-security-question
// Kirim pertanyaan keamanan yang tersimpan ke email pengguna.

import { query } from '../db.js';
import { sendSecurityQuestionEmail } from '../mailer.js';

async function forgotSecurityQuestion(req, res) {
  try {
    const { identifier } = req.body ?? {};
    const id = identifier?.trim();
    const emailId = id?.toLowerCase();
    if (!id) return res.status(400).json({ message: 'Username atau email wajib diisi.' });

    const rows = await query(
      `SELECT g.fdUserID AS username, w.email, w.sec_question AS secQuestion
       FROM userinfofrompublisher g
       LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE g.fdUserID = ? OR w.email = ?
       LIMIT 1`,
      [id, emailId],
    );

    if (rows.length === 0 || !rows[0].email || !rows[0].secQuestion) {
      return res.status(200).json({ message: 'Jika email terdaftar, pertanyaan keamanan sudah dikirim.' });
    }

    const { username, email, secQuestion } = rows[0];

    await sendSecurityQuestionEmail(email, username, secQuestion);

    return res.status(200).json({ message: 'Jika email terdaftar, pertanyaan keamanan sudah dikirim.' });
  } catch (err) {
    console.error('[forgot-security-question] error:', err);
    return res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' });
  }
}

export default forgotSecurityQuestion;
