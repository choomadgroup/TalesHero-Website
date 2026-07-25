// ============================================================
// Tales Hero Indonesia — Update Profil Akun
// POST /auth/update-profile
//
// Body JSON: { currentUsername, username, email }
// Username is the game account key, so both game and website
// records are renamed together inside one transaction.
// ============================================================

import { pool } from '../db.js';

function validate({ username, email }) {
  if (!username || username.trim().length < 3 || username.trim().length > 50) {
    return 'Username harus antara 3–50 karakter.';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return 'Username hanya boleh huruf, angka, dan underscore.';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Format email tidak valid.';
  }
  return null;
}

async function updateProfile(req, res) {
  const { currentUsername, username, email } = req.body ?? {};
  const nextUsername = username?.trim();
  const nextEmail = email?.trim();
  const validationError = validate({ username: nextUsername, email: nextEmail });

  if (!currentUsername?.trim()) {
    return res.status(400).json({ message: 'Username saat ini wajib diisi.' });
  }
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [currentRows] = await conn.query(
      'SELECT fdUserID FROM userinfofrompublisher WHERE fdUserID = ? LIMIT 1 FOR UPDATE',
      [currentUsername.trim()],
    );
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }

    const [duplicateRows] = await conn.query(
      'SELECT fdUserID FROM userinfofrompublisher WHERE fdUserID = ? AND fdUserID <> ? LIMIT 1',
      [nextUsername, currentUsername.trim()],
    );
    if (duplicateRows.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'Username tersebut sudah digunakan.' });
    }

    await conn.query(
      'UPDATE userinfofrompublisher SET fdUserID = ? WHERE fdUserID = ?',
      [nextUsername, currentUsername.trim()],
    );

    const [websiteRows] = await conn.query(
      'SELECT username FROM tales_hero_web_users WHERE username = ? LIMIT 1 FOR UPDATE',
      [currentUsername.trim()],
    );
    if (websiteRows.length > 0) {
      await conn.query(
        'UPDATE tales_hero_web_users SET username = ?, email = ? WHERE username = ?',
        [nextUsername, nextEmail, currentUsername.trim()],
      );
    } else {
      // Legacy game accounts may not have a website row yet. Create one
      // without inventing a security answer, so the existing reset flow
      // remains explicit and safe.
      await conn.query(
        `INSERT INTO tales_hero_web_users (username, email, sec_question, sec_answer_hash)
         VALUES (?, ?, '', '')`,
        [nextUsername, nextEmail],
      );
    }

    await conn.commit();
    return res.status(200).json({
      message: 'Profil berhasil diperbarui.',
      user: { username: nextUsername, email: nextEmail },
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