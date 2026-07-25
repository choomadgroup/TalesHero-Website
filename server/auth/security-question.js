import { query } from '../db.js';

async function securityQuestion(req, res) {
  try {
    const { username, email } = req.body ?? {};
    const identifier = username?.trim();
    const emailIdentifier = email?.trim();

    if (!identifier && !emailIdentifier) {
      return res.status(400).json({ message: 'Username atau email wajib diisi.' });
    }

    const rows = await query(
      `SELECT g.fdUserID, w.sec_question AS secQuestion
       FROM userinfofrompublisher g
       LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE (? <> '' AND g.fdUserID = ?)
          OR (? <> '' AND w.email = ?)
       LIMIT 1`,
      [identifier ?? '', identifier ?? '', emailIdentifier ?? '', emailIdentifier ?? ''],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }
    if (!rows[0].secQuestion) {
      return res.status(409).json({ message: 'Akun ini belum memiliki pertanyaan keamanan.' });
    }

    return res.status(200).json({
      username: rows[0].fdUserID,
      secQuestion: rows[0].secQuestion,
    });
  } catch (error) {
    console.error('[security-question] error:', error);
    return res.status(500).json({ message: 'Pertanyaan keamanan gagal dimuat.' });
  }
}

export default securityQuestion;