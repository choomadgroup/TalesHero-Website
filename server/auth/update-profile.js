// ============================================================
// Tales Hero Indonesia — Update Profil Akun
// POST /auth/update-profile
//
// Body JSON: { currentUsername, username, email }
// Username is the game account key, so both game and website
// records are renamed together inside one transaction.
// ============================================================

import { pool } from '../db.js';
import crypto from 'node:crypto';
import { ALLOWED_SECURITY_QUESTIONS } from './security-questions.js';

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function md5(value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex');
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function updateProfile(req, res) {
  const { currentUsername, currentPassword, username, email, secQuestion, secAnswer } = req.body ?? {};
  const current = currentUsername?.trim();
  const requestedUsername = username?.trim();
  const requestedEmail = email?.trim();
  const requestedQuestion = secQuestion?.trim();
  const requestedAnswer = secAnswer?.trim();

  if (!current) {
    return res.status(400).json({ message: 'Username saat ini wajib diisi.' });
  }
  if (!currentPassword) {
    return res.status(400).json({ message: 'Kata sandi saat ini wajib diisi.' });
  }
  if (requestedUsername && requestedUsername !== current) {
    return res.status(400).json({ message: 'Username tidak dapat diubah.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [currentRows] = await conn.query(
      'SELECT fdUserID, fdPassword FROM userinfofrompublisher WHERE fdUserID = ? LIMIT 1 FOR UPDATE',
      [current],
    );
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }
    if (md5(currentPassword) !== currentRows[0].fdPassword) {
      await conn.rollback();
      return res.status(401).json({ message: 'Kata sandi saat ini salah.' });
    }

    const [websiteRows] = await conn.query(
      `SELECT username, email, sec_question, sec_answer_hash
       FROM tales_hero_web_users
       WHERE username = ? LIMIT 1 FOR UPDATE`,
      [current],
    );

    const website = websiteRows[0] ?? {};
    const existingEmail = website.email?.trim() ?? '';
    const existingQuestion = website.sec_question?.trim() ?? '';
    const existingAnswerHash = website.sec_answer_hash ?? '';

    let nextEmail = existingEmail;
    if (existingEmail) {
      if (requestedEmail && requestedEmail !== existingEmail) {
        await conn.rollback();
        return res.status(400).json({ message: 'Email sudah terdaftar dan tidak dapat diubah.' });
      }
    } else if (requestedEmail) {
      if (!validEmail(requestedEmail)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Format email tidak valid.' });
      }
      nextEmail = requestedEmail;
    }

    let nextQuestion = existingQuestion;
    let nextAnswerHash = existingAnswerHash;
    if (existingQuestion) {
      if (requestedQuestion && requestedQuestion !== existingQuestion) {
        await conn.rollback();
        return res.status(400).json({ message: 'Pertanyaan keamanan sudah diatur dan tidak dapat diubah.' });
      }
      if (requestedAnswer) {
        await conn.rollback();
        return res.status(400).json({ message: 'Pertanyaan keamanan sudah diatur dan tidak dapat diubah.' });
      }
    } else if (requestedQuestion || requestedAnswer) {
      if (!ALLOWED_SECURITY_QUESTIONS.includes(requestedQuestion)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Pertanyaan keamanan tidak valid.' });
      }
      if (!requestedAnswer) {
        await conn.rollback();
        return res.status(400).json({ message: 'Jawaban pertanyaan keamanan wajib diisi.' });
      }
      nextQuestion = requestedQuestion;
      nextAnswerHash = sha256(requestedAnswer.toLowerCase());
    }

    if (websiteRows.length > 0) {
      await conn.query(
        `UPDATE tales_hero_web_users
         SET email = ?, sec_question = ?, sec_answer_hash = ?
         WHERE username = ?`,
        [nextEmail, nextQuestion, nextAnswerHash, current],
      );
    } else {
      await conn.query(
        `INSERT INTO tales_hero_web_users (username, email, sec_question, sec_answer_hash)
         VALUES (?, ?, ?, ?)`,
        [current, nextEmail, nextQuestion, nextAnswerHash],
      );
    }

    await conn.commit();
    return res.status(200).json({
      message: 'Profil berhasil diperbarui.',
      user: { username: current, email: nextEmail, secQuestion: nextQuestion },
    });
  } catch (error) {
    try { await conn.rollback(); } catch { /* connection cleanup follows */ }
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username tersebut sudah digunakan.' });
    }
    console.error('[update-profile] error:', error);
    return res.status(500).json({ message: 'Profil gagal diperbarui.' });
  } finally {
    conn.release();
  }
}

export default updateProfile;