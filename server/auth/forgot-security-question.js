// POST /auth/forgot-security-question
// Kirim pertanyaan keamanan ke email pengguna.
// Input: username game ATAU alamat email — sistem cari sendiri email terdaftar.

import { query } from '../db.js';
import { sendSecurityQuestionEmail } from '../mailer.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function forgotSecurityQuestion(req, res) {
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
        `SELECT g.fdUserID AS username, w.email, w.sec_question AS secQuestion, w.sec_answer AS secAnswer
         FROM userinfofrompublisher g
         LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
         WHERE LOWER(w.email) = ?
         LIMIT 1`,
        [value.toLowerCase()],
      );
    } else {
      rows = await query(
        `SELECT g.fdUserID AS username, w.email, w.sec_question AS secQuestion, w.sec_answer AS secAnswer
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
    if (!rows[0].secQuestion) {
      return res.status(400).json({ message: 'Akun ini belum mengatur pertanyaan keamanan.' });
    }

    const { username, email, secQuestion, secAnswer } = rows[0];

    await sendSecurityQuestionEmail(email, username, secQuestion, secAnswer);

    return res.status(200).json({
      message    : 'Jika akun terdaftar, pertanyaan keamanan sudah dikirim.',
      maskedEmail: maskEmail(email),
    });
  } catch (err) {
    console.error('[forgot-security-question] error:', err);
    return res.status(500).json({ message: 'Gagal mengirim email. Coba lagi nanti.' });
  }
}

export default forgotSecurityQuestion;
