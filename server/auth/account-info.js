import crypto from 'node:crypto';
import { query } from '../db.js';
import { sendAccountInfoEmail, sendPasswordResetEmail } from '../mailer.js';
import { accountInfoRateLimit } from './rate-limit.js';
import { captchaError, verifyRecaptcha } from './recaptcha.js';

const GENERIC_MESSAGE = 'Jika email tersebut terdaftar, informasi akun dan link reset kata sandi sudah dikirim.';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function maskIp(ip) {
  if (!ip) return 'Tidak tercatat';
  const value = String(ip).trim();
  if (value.includes('.')) {
    const parts = value.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  }
  if (value.includes(':')) {
    return `${value.split(':').slice(0, 3).join(':')}:****`;
  }
  return 'Disamarkan';
}

function formatDate(value) {
  if (!value) return 'Tidak tercatat';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tidak tercatat';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(date) + ' WIB';
}

async function accountInfo(req, res) {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const captcha = req.body?.captcha;

    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Masukkan alamat email yang valid.' });
    }
    if (!await verifyRecaptcha(captcha, req.ip)) return captchaError(res);

    const limit = accountInfoRateLimit(req, email);
    if (limit) {
      res.setHeader('Retry-After', String(limit.retryAfter));
      return res.status(429).json({
        message: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(limit.retryAfter / 60)} menit.`,
      });
    }

    const rows = await query(
      `SELECT g.fdUserID AS username,
              g.fdGameID AS gameId,
              w.email,
              w.created_at AS createdAt,
              w.registered_ip AS registeredIp
       FROM tales_hero_web_users w
       INNER JOIN userinfofrompublisher g ON g.fdUserID = w.username
       WHERE LOWER(w.email) = ?
       LIMIT 1`,
      [email],
    );

    if (rows.length === 0) return res.status(200).json({ message: GENERIC_MESSAGE });

    const account = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `DELETE FROM password_reset_tokens WHERE username = ? AND type = 'password'`,
      [account.username],
    );
    await query(
      `INSERT INTO password_reset_tokens (username, token, type, expires_at)
       VALUES (?, ?, 'password', ?)`,
      [account.username, token, expiresAt],
    );

    try {
      await sendAccountInfoEmail({
        toEmail: account.email,
        username: account.username,
        gameId: account.gameId,
        createdAt: formatDate(account.createdAt),
        registeredIp: maskIp(account.registeredIp),
        resetToken: token,
      });
    } catch (error) {
      await query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
      throw error;
    }

    return res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[account-info] error:', err);
    return res.status(500).json({ message: 'Permintaan tidak dapat diproses. Coba lagi nanti.' });
  }
}

export default accountInfo;