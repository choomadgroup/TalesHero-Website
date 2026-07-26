// POST /auth/forgot-security-question
// Kirim pertanyaan keamanan yang tersimpan ke email pengguna.

import { query } from '../db.js';
import { sendSecurityQuestionEmail } from '../mailer.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function forgotSecurityQuestion(req, res) {
  try {
    const { username: requestedUsername, email: requestedEmail, captcha } = req.body ?? {};
    const usernameValue = requestedUsername?.trim();
    const emailValue = requestedEmail?.trim()?.toLowerCase();
    if (!usernameValue || !emailValue) {
      return res.status(400).json({ message: 'Username game dan email wajib diisi.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return res.status(400).json({ message: 'Format email tidak valid.' });
    }
    if (!await verifyRecaptcha(captcha, req.ip)) return captchaError(res);

    const rows = await query(
      `SELECT g.fdUserID AS username, w.email, w.sec_question AS secQuestion, w.sec_answer AS secAnswer
       FROM userinfofrompublisher g
       LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE g.fdUserID = ? AND LOWER(w.email) = ?
       LIMIT 1`,
      [usernameValue, emailValue],
    );

    if (rows.length === 0 || !rows[0].email || !rows[0].secQuestion) {
      return res.status(200).json({ message: 'Jika email terdaftar, pertanyaan keamanan sudah dikirim.' });
    }

    const { username, email, secQuestion, secAnswer } = rows[0];

    await sendSecurityQuestionEmail(email, username, secQuestion, secAnswer);

    return res.status(200).json({ message: 'Jika email terdaftar, pertanyaan keamanan sudah dikirim.', maskedEmail: maskEmail(email) });
  } catch (err) {
    console.error('[forgot-security-question] error:', err);
    return res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' });
  }
}

export default forgotSecurityQuestion;
