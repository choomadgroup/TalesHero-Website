import crypto from 'node:crypto';
import { pool } from '../db.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

async function verifyRegistration(req, res) {
  let conn;
  try {
    const token = String(req.query?.token ?? '').trim();
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: 'Link verifikasi tidak valid.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT username, email, game_password_hash, sec_question,
              sec_answer_hash, sec_answer, created_ip
       FROM tales_hero_pending_registrations
       WHERE token_hash = ? AND expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)],
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Link verifikasi sudah kedaluwarsa atau sudah digunakan. Silakan daftar kembali.',
      });
    }

    const pending = rows[0];
    const [existingGame] = await conn.query(
      'SELECT fdUserID FROM userinfofrompublisher WHERE fdUserID = ? LIMIT 1',
      [pending.username],
    );
    if (existingGame.length > 0) {
      await conn.query('DELETE FROM tales_hero_pending_registrations WHERE token_hash = ?', [hashToken(token)]);
      await conn.commit();
      return res.status(409).json({ message: 'Username sudah terdaftar di game.' });
    }

    const [existingEmail] = await conn.query(
      'SELECT username FROM tales_hero_web_users WHERE email = ? LIMIT 1',
      [pending.email],
    );
    if (existingEmail.length > 0) {
      await conn.query('DELETE FROM tales_hero_pending_registrations WHERE token_hash = ?', [hashToken(token)]);
      await conn.commit();
      return res.status(409).json({ message: 'Email sudah terdaftar dan tidak dapat digunakan kembali.' });
    }

    await conn.query(
      `INSERT INTO userinfofrompublisher (fdUserID, fdGameID, fdPassword)
       VALUES (?, ?, ?)`,
      [pending.username, pending.username, pending.game_password_hash],
    );
    await conn.query(
      `INSERT INTO tales_hero_web_users
       (username, email, sec_question, sec_answer_hash, sec_answer, registered_ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pending.username,
        pending.email,
        pending.sec_question,
        pending.sec_answer_hash,
        pending.sec_answer,
        pending.created_ip,
      ],
    );
    await conn.query(
      'DELETE FROM tales_hero_pending_registrations WHERE token_hash = ?',
      [hashToken(token)],
    );
    await conn.commit();
    conn.release();
    conn = null;

    return res.status(200).json({
      message: 'Email berhasil diverifikasi. Akun game kamu sudah aktif.',
      username: pending.username,
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch { /* ignore */ }
    }
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Akun atau email sudah terdaftar.' });
    }
    console.error('[verify-registration] error:', err);
    return res.status(500).json({ message: 'Verifikasi gagal. Coba lagi nanti.' });
  } finally {
    if (conn) conn.release();
  }
}

export default verifyRegistration;