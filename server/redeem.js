// ============================================================
//  Tales Hero Indonesia — Redeem Code Handler
//  POST /auth/redeem
//
//  Menggunakan tabel tblredeem_code + tblredeem_code_claim
//  (tabel dari admin tools) yang sudah ada di tr_game_db.
//
//  Reward yang didukung:
//    - fdRewardCash  → tambah ke userinfofrompublisher.fdCash
//    - fdRewardTR    → tambah ke userinfogame.fdGameMoney
//    - fdRewardItemNum → kirim ke tblgift (Giftbox) atau
//                        userstoragegiftitem (Warehouse)
// ============================================================

import { query } from './db.js';
import { getSessionUsername } from './auth/session.js';

// ── Helper: ambil detail user dari username (fdUserID) ───────
async function getUserDetail(username) {
  const rows = await query(
    `SELECT g.fdUserID, g.fdCash,
            i.fdUserNum, i.fdNickname,
            ig.fdGameMoney
     FROM userinfofrompublisher g
     LEFT JOIN userinfo i ON i.fdUID = g.fdUserID
     LEFT JOIN userinfogame ig ON ig.fdUserNum = i.fdUserNum
     WHERE g.fdUserID = ?
     LIMIT 1`,
    [username],
  );
  return rows[0] ?? null;
}

// ── Helper: kirim item ke Giftbox (tblgift) ──────────────────
async function deliverToGiftbox(senderUserNum, senderNickname, receiverUserNum, itemNum, memo) {
  await query(
    `INSERT INTO tblgift
       (fdSendUserNum, fdSendNickname, fdReceiveUserNum,
        fdGiftItemDescNum, fdNotified, fdMemo, fdExpireDate)
     VALUES (?, ?, ?, ?, 0, ?, NULL)`,
    [senderUserNum, senderNickname, receiverUserNum, itemNum, memo],
  );
}

// ── Helper: kirim item ke Warehouse (userstoragegiftitem) ────
async function deliverToWarehouse(receiverUserNum, itemNum, senderNickname, memo) {
  // fdUniqueNum tidak AUTO_INCREMENT — generate pakai timestamp µs + userNum
  const uniqueNum = BigInt(Date.now()) * 10000n + BigInt(receiverUserNum % 10000);
  await query(
    `INSERT INTO userstoragegiftitem
       (fdUniqueNum, fdUserNum, fdItemNum, fdDateTime, fdSendNickname, fdMemo)
     VALUES (?, ?, ?, NOW(), ?, ?)`,
    [uniqueNum.toString(), receiverUserNum, itemNum, senderNickname, memo],
  );
}

// ── Handler utama ─────────────────────────────────────────────
async function redeem(req, res) {
  try {
    // 1. Verifikasi sesi login
    const username = await getSessionUsername(req);
    if (!username) {
      return res.status(401).json({ message: 'Kamu harus login dulu untuk redeem kode.' });
    }

    // 2. Validasi input
    const code = (req.body?.code ?? '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ message: 'Kode tidak boleh kosong.' });
    }
    if (!/^[A-Z0-9\-_]{3,64}$/.test(code)) {
      return res.status(400).json({ message: 'Format kode tidak valid.' });
    }

    // 3. Ambil data user (butuh fdUserNum dan nickname untuk claim)
    const user = await getUserDetail(username);
    if (!user) {
      return res.status(401).json({ message: 'Akun tidak ditemukan.' });
    }
    const userNum  = user.fdUserNum;
    const nickname = user.fdNickname ?? username;

    // 4. Cari kode di tblredeem_code
    const codeRows = await query(
      `SELECT fdRedeemId, fdCode,
              fdRewardCash, fdRewardTR,
              fdRewardItemNum, fdRewardItemName, fdDeliveryTarget,
              fdIsActive, fdClaimCount, fdExpiredAt
       FROM tblredeem_code
       WHERE fdCode = ?
       LIMIT 1`,
      [code],
    );

    if (codeRows.length === 0) {
      return res.status(404).json({ message: 'Kode tidak ditemukan atau sudah tidak berlaku.' });
    }

    const rc = codeRows[0];

    // 5. Cek aktif
    if (!rc.fdIsActive) {
      return res.status(410).json({ message: 'Kode sudah tidak aktif.' });
    }

    // 6. Cek expired
    if (rc.fdExpiredAt && new Date(rc.fdExpiredAt) < new Date()) {
      return res.status(410).json({ message: 'Kode sudah kedaluwarsa.' });
    }

    // 7. Cek apakah user sudah pernah claim kode ini
    const claimCheck = await query(
      `SELECT fdClaimId FROM tblredeem_code_claim
       WHERE fdRedeemId = ? AND fdUserNum = ?
       LIMIT 1`,
      [rc.fdRedeemId, userNum],
    );
    if (claimCheck.length > 0) {
      return res.status(409).json({ message: 'Kamu sudah pernah menggunakan kode ini sebelumnya.' });
    }

    // 8. Terapkan reward ─────────────────────────────────────
    const cash   = Number(rc.fdRewardCash)   || 0;
    const tr     = Number(rc.fdRewardTR)     || 0;
    const itemNum = rc.fdRewardItemNum ? Number(rc.fdRewardItemNum) : null;
    const delivery = rc.fdDeliveryTarget ?? 'Giftbox';
    const memo   = `Redeem Code: ${rc.fdCode}`;
    const SYSTEM_USER_NUM = 1; // UserNum pengirim sistem

    if (cash > 0) {
      await query(
        `UPDATE userinfofrompublisher SET fdCash = fdCash + ? WHERE fdUserID = ?`,
        [cash, username],
      );
    }

    if (tr > 0) {
      await query(
        `UPDATE userinfogame ig
         JOIN userinfo i ON ig.fdUserNum = i.fdUserNum
         SET ig.fdGameMoney = ig.fdGameMoney + ?
         WHERE i.fdUID = ?`,
        [tr, username],
      );
    }

    if (itemNum) {
      const senderNickname = '[GM]System';
      if (delivery === 'Warehouse') {
        await deliverToWarehouse(userNum, itemNum, senderNickname, memo);
      } else {
        // Default: Giftbox
        await deliverToGiftbox(SYSTEM_USER_NUM, senderNickname, userNum, itemNum, memo);
      }
    }

    // 9. Catat claim di tblredeem_code_claim
    await query(
      `INSERT INTO tblredeem_code_claim
         (fdRedeemId, fdCode, fdUserNum, fdUserId, fdNickname,
          fdClaimedCash, fdClaimedTR, fdClaimedItemNum, fdClaimedItemName, fdDeliveryTarget)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rc.fdRedeemId,
        rc.fdCode,
        userNum,
        username,
        nickname,
        cash,
        tr,
        itemNum,
        rc.fdRewardItemName ?? null,
        itemNum ? delivery : null,
      ],
    );

    // 10. Tambah claim count
    await query(
      `UPDATE tblredeem_code SET fdClaimCount = fdClaimCount + 1 WHERE fdRedeemId = ?`,
      [rc.fdRedeemId],
    );

    // 11. Susun pesan sukses
    const parts = [];
    if (cash > 0)   parts.push(`${Number(cash).toLocaleString('id-ID')} Cash`);
    if (tr > 0)     parts.push(`${Number(tr).toLocaleString('id-ID')} TR`);
    if (itemNum)    parts.push(`${rc.fdRewardItemName ?? 'Item'} (${delivery})`);
    const rewardSummary = parts.join(' + ') || 'Hadiah spesial';

    return res.status(200).json({
      message: `Kode berhasil ditukarkan! Kamu mendapatkan: ${rewardSummary}.`,
      reward: {
        cash,
        tr,
        item: itemNum ? {
          num:      itemNum,
          name:     rc.fdRewardItemName ?? null,
          delivery,
        } : null,
        summary: rewardSummary,
      },
    });

  } catch (err) {
    console.error('[redeem] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server. Coba lagi nanti.' });
  }
}

export default redeem;
