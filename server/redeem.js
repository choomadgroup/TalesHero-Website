// ============================================================
//  Tales Hero Indonesia — Redeem Code Handler
//  POST /auth/redeem
//
//  Body: { code }
//  Membutuhkan sesi login aktif (cookie taleshero_session).
//  Reward types: 'cash' (fdCash) | 'tr' (fdGameMoney)
// ============================================================

import { query } from './db.js';
import { getSessionUsername } from './auth/session.js';

async function redeem(req, res) {
  try {
    const username = await getSessionUsername(req);
    if (!username) {
      return res.status(401).json({ message: 'Kamu harus login dulu untuk redeem kode.' });
    }

    const code = (req.body?.code ?? '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ message: 'Kode tidak boleh kosong.' });
    }
    if (!/^[A-Z0-9\-_]{3,50}$/.test(code)) {
      return res.status(400).json({ message: 'Format kode tidak valid.' });
    }

    // ── 1. Cari kode ─────────────────────────────────────────
    const codeRows = await query(
      `SELECT id, reward_type, reward_amount, max_uses, used_count, expires_at
       FROM redeem_codes
       WHERE code = ?
       LIMIT 1`,
      [code],
    );

    if (codeRows.length === 0) {
      return res.status(404).json({ message: 'Kode tidak ditemukan atau sudah tidak berlaku.' });
    }

    const rc = codeRows[0];

    // ── 2. Cek expired ────────────────────────────────────────
    if (rc.expires_at && new Date(rc.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Kode sudah kedaluwarsa.' });
    }

    // ── 3. Cek kuota ──────────────────────────────────────────
    if (rc.used_count >= rc.max_uses) {
      return res.status(410).json({ message: 'Kode sudah habis digunakan.' });
    }

    // ── 4. Cek apakah user sudah redeem kode ini ──────────────
    const useRows = await query(
      `SELECT id FROM redeem_code_uses WHERE code = ? AND username = ? LIMIT 1`,
      [code, username],
    );
    if (useRows.length > 0) {
      return res.status(409).json({ message: 'Kamu sudah menggunakan kode ini sebelumnya.' });
    }

    // ── 5. Terapkan reward ────────────────────────────────────
    if (rc.reward_type === 'cash') {
      await query(
        `UPDATE userinfofrompublisher SET fdCash = fdCash + ? WHERE fdUserID = ?`,
        [rc.reward_amount, username],
      );
    } else if (rc.reward_type === 'tr') {
      await query(
        `UPDATE userinfogame ig
         JOIN userinfo i ON ig.fdUserNum = i.fdUserNum
         SET ig.fdGameMoney = ig.fdGameMoney + ?
         WHERE i.fdUID = ?`,
        [rc.reward_amount, username],
      );
    }

    // ── 6. Catat pemakaian ────────────────────────────────────
    await query(
      `INSERT INTO redeem_code_uses (code, username) VALUES (?, ?)`,
      [code, username],
    );
    await query(
      `UPDATE redeem_codes SET used_count = used_count + 1 WHERE id = ?`,
      [rc.id],
    );

    const rewardLabel = rc.reward_type === 'cash' ? 'Cash' : 'TR';
    return res.status(200).json({
      message: `Kode berhasil ditukarkan! Kamu mendapatkan ${Number(rc.reward_amount).toLocaleString('id-ID')} ${rewardLabel}.`,
      reward: {
        type:   rc.reward_type,
        amount: rc.reward_amount,
        label:  rewardLabel,
      },
    });

  } catch (err) {
    console.error('[redeem] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  }
}

export default redeem;
