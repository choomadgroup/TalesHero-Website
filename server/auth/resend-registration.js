import crypto from 'node:crypto';
import { pool } from '../db.js';
import { sendRegistrationVerificationEmail } from '../mailer.js';
import { getClientIp } from './client-ip.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

async function resendRegistration(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT username, email, token_hash, expires_at, game_password_hash,
              resend_count, last_sent_at
       FROM tales_hero_pending_registrations
       WHERE email = ?
       LIMIT 1
       FOR UPDATE`,
      [email],
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        message: 'Pendaftaran dengan email tersebut tidak ditemukan. Silakan daftar terlebih dahulu.',
      });
    }

    const pending = rows[0];
    if (Number(pending.resend_count) >= MAX_RESENDS) {
      await conn.rollback();
      return res.status(429).json({
        message: 'Batas kirim ulang tercapai. Silakan daftar ulang setelah pendaftaran ini dihapus otomatis.',
      });
    }

    if (pending.last_sent_at) {
      const [cooldownRows] = await conn.query(
        'SELECT GREATEST(0, ? - TIMESTAMPDIFF(SECOND, ?, NOW())) AS retry_after',
        [RESEND_COOLDOWN_SECONDS, pending.last_sent_at],
      );
      const retryAfter = Number(cooldownRows[0]?.retry_after ?? 0);
      if (retryAfter > 0) {
        await conn.rollback();
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({
          message: `Tunggu ${retryAfter} detik sebelum mengirim ulang link.`,
          retryAfter,
        });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    await conn.query(
      `UPDATE tales_hero_pending_registrations
       SET token_hash = ?,
           expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE),
           resend_count = resend_count + 1,
           last_sent_at = NOW(),
           created_ip = ?
       WHERE email = ?`,
      [tokenHash, getClientIp(req), email],
    );
    await conn.commit();
    conn.release();
    conn = null;

    try {
      await sendRegistrationVerificationEmail(pending.email, pending.username, token);
    } catch (emailError) {
      // Restore the previous link if the provider fails, so the player can
      // safely retry without burning a resend slot.
      await pool.query(
        `UPDATE tales_hero_pending_registrations
         SET token_hash = ?, expires_at = ?, resend_count = ?, last_sent_at = ?
         WHERE email = ? AND token_hash = ?`,
        [
          pending.token_hash,
          pending.expires_at,
          pending.resend_count,
          pending.last_sent_at,
          email,
          tokenHash,
        ],
      );
      console.warn('[resend-registration] email temporarily unavailable:', emailError?.message ?? emailError);
      res.setHeader('Retry-After', '30');
      return res.status(503).json({
        message: 'Layanan email sedang sibuk. Coba kirim ulang beberapa saat lagi.',
      });
    }

    return res.status(200).json({
      message: 'Link verifikasi baru sudah dikirim. Link berlaku selama 30 menit.',
      retryAfter: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    if (conn) {
      try { await conn.rollback(); } catch { /* ignore */ }
    }
    console.error('[resend-registration] error:', error);
    return res.status(500).json({ message: 'Gagal mengirim ulang link. Coba lagi nanti.' });
  } finally {
    if (conn) conn.release();
  }
}

export default resendRegistration;