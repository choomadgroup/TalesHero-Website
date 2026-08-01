// ============================================================
//  Tales Hero Indonesia — Handler Login
//  POST /auth/login
//
//  Body JSON yang dikirim dari Login.tsx:
//    { username, password, captcha }
//  (field `username` bisa berisi username ATAU email)
//
//  Pasang di Express:
//    const login = require('./auth/login');
//    app.post('/auth/login', express.json(), login);
// ============================================================

import crypto from 'node:crypto';
import { query } from '../db.js';
import { createSession } from './session.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';

/**
 * Express route handler untuk login.
 */
async function login(req, res) {
  try {
    const { username, password, captcha } = req.body ?? {};
    const identifier = username?.trim();

    // ── 1. Validasi input dasar ───────────────────────────
    if (!identifier) {
      return res.status(400).json({ message: 'Username atau email wajib diisi.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Kata sandi wajib diisi.' });
    }
    if (!await verifyRecaptcha(captcha, req.ip)) return captchaError(res);

    // ── 2. Cari user + data website (email, pertanyaan keamanan) ──
    const rows = await query(
       `SELECT g.fdUserID, g.fdGameID, g.fdPassword, g.fdCash,
               i.fdNickname,
               ig.fdGameMoney,
               COALESCE(uip.TotalPoint, 0) AS mauTotal,
               w.email, w.sec_question AS secQuestion
       FROM userinfofrompublisher g
        LEFT JOIN userinfo i ON i.fdUID = g.fdUserID
        LEFT JOIN userinfogame ig ON ig.fdUserNum = i.fdUserNum
        LEFT JOIN (
          SELECT fdUserNum, SUM(fdPoint) AS TotalPoint
          FROM userinfopoint GROUP BY fdUserNum
        ) uip ON uip.fdUserNum = i.fdUserNum
        LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
        WHERE g.fdUserID = ? OR w.email = ? LIMIT 1`,
       [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username game atau kata sandi salah.' });
    }

    const user = rows[0];
    const incomingHash = crypto.createHash('md5').update(password, 'utf8').digest('hex');

    // ── 3. Verifikasi format password yang dipakai game ────
    const passwordMatch = incomingHash === user.fdPassword;
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Username game atau kata sandi salah.' });
    }

    // ── 4. Berhasil — buat sesi server dan kembalikan info user ─
    await createSession(res, user.fdUserID);
    return res.status(200).json({
      message: 'Login berhasil.',
      user: {
        username:    user.fdUserID,
        nickname:    user.fdNickname ?? '',
        gameId:      user.fdGameID,
        cash:        user.fdCash,
        mau:         user.mauTotal ?? 0,
        tr:          user.fdGameMoney ?? 0,
        email:       user.email       ?? '',
        secQuestion: user.secQuestion ?? '',
      },
    });

  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  }
}

export default login;
