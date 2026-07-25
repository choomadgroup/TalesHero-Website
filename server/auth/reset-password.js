import crypto from 'node:crypto';
import { query } from '../db.js';

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

async function resetPassword(req, res) {
  try {
    const { username, secAnswer, newPassword } = req.body ?? {};
    const account = username?.trim();

    if (!account || !secAnswer?.trim() || !newPassword) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    if (newPassword.length < 8 || newPassword.length > 50) {
      return res.status(400).json({ message: 'Kata sandi baru harus 8–50 karakter.' });
    }

    const rows = await query(
      `SELECT g.fdUserID, w.sec_question AS secQuestion, w.sec_answer_hash AS answerHash
       FROM userinfofrompublisher g
       INNER JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE g.fdUserID = ?
       LIMIT 1`,
      [account],
    );

    if (rows.length === 0 || !rows[0].secQuestion || !rows[0].answerHash) {
      return res.status(401).json({ message: 'Username atau pertanyaan keamanan tidak cocok.' });
    }

    const answerHash = sha256(secAnswer.trim().toLowerCase());
    if (answerHash !== rows[0].answerHash) {
      return res.status(401).json({ message: 'Jawaban pertanyaan keamanan salah.' });
    }

    const newPassHash = crypto.createHash('md5').update(newPassword, 'utf8').digest('hex');
    await query(
      'UPDATE userinfofrompublisher SET fdPassword = ? WHERE fdUserID = ?',
      [newPassHash, account],
    );

    return res.status(200).json({ message: 'Kata sandi berhasil diatur ulang.' });
  } catch (error) {
    console.error('[reset-password] error:', error);
    return res.status(500).json({ message: 'Kata sandi gagal diatur ulang.' });
  }
}

export default resetPassword;