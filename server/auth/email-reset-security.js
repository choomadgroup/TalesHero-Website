// POST /auth/email-reset-security
// Reset pertanyaan keamanan menggunakan token dari email.

import crypto from 'node:crypto';
import { query } from '../db.js';

const ALLOWED_QUESTIONS = [
  'Nama hewan kesayangan kamu?',
  'Warna apa yang kamu suka?',
  'Apa nama panggilan kamu?',
];

async function emailResetSecurity(req, res) {
  try {
    const { token, secQuestion, secAnswer } = req.body ?? {};
    if (!token || !secQuestion || !secAnswer?.trim()) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    if (!ALLOWED_QUESTIONS.includes(secQuestion)) {
      return res.status(400).json({ message: 'Pertanyaan keamanan tidak valid.' });
    }

    const rows = await query(
      `SELECT username, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = ? AND type = 'security'
       LIMIT 1`,
      [token],
    );

    if (rows.length === 0)       return res.status(400).json({ message: 'Link tidak valid atau sudah kadaluarsa.' });
    if (rows[0].used_at)         return res.status(400).json({ message: 'Link ini sudah pernah digunakan.' });
    if (new Date() > new Date(rows[0].expires_at))
                                 return res.status(400).json({ message: 'Link sudah kadaluarsa. Minta link baru.' });

    const { username } = rows[0];
    const answerHash = crypto.createHash('sha256').update(secAnswer.trim().toLowerCase(), 'utf8').digest('hex');

    // Update pertanyaan & jawaban keamanan
    await query(
      `UPDATE tales_hero_web_users SET sec_question = ?, sec_answer_hash = ? WHERE username = ?`,
      [secQuestion, answerHash, username],
    );

    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token],
    );

    return res.status(200).json({ message: 'Pertanyaan keamanan berhasil diperbarui.' });
  } catch (err) {
    console.error('[email-reset-security] error:', err);
    return res.status(500).json({ message: 'Gagal memperbarui pertanyaan keamanan.' });
  }
}

export default emailResetSecurity;
