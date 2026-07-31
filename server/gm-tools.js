// ============================================================
//  Tales Hero Indonesia — GM Tools Backend
//  Fitur dari PHP admin tool (teman) diterjemahkan ke Node.js
//
//  Routes (dihandle lewat vite.config.ts):
//  GET    /api/admin/gm/stats
//  GET    /api/admin/gm/players?q=
//  GET    /api/admin/gm/players/:userNum
//  POST   /api/admin/gm/players/:userNum/cash
//  POST   /api/admin/gm/players/:userNum/tr
//  POST   /api/admin/gm/players/:userNum/item
//  PATCH  /api/admin/gm/players/:userNum/ban
//  PATCH  /api/admin/gm/players/:userNum/role
//  PATCH  /api/admin/gm/players/:userNum/nickname
//  PATCH  /api/admin/gm/players/:userNum/password
//  GET    /api/admin/gm/players/:userNum/inventory?q=
//  DELETE /api/admin/gm/players/:userNum/inventory/:invNum
//  PATCH  /api/admin/gm/players/:userNum/inventory/:invNum/extend
//  GET    /api/admin/gm/requests
//  POST   /api/admin/gm/requests/:id/approve
//  POST   /api/admin/gm/requests/:id/reject
//  GET    /api/admin/gm/logs
//  GET    /api/admin/gm/items?q=
// ============================================================

import crypto from 'node:crypto';
import { query, pool } from './db.js';
import { getAdminUser } from './admin-session.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(res, status, data) {
  res.status(status).json(data);
}

function isOwner(admin) {
  return admin?.role === 'Owner';
}

async function logAction(admin, actionType, targetInfo, detail = '') {
  try {
    await query(
      `INSERT INTO tbladmin_action_log
       (fdActionType, fdActorUserNum, fdActorUserId, fdActorNickname, fdTargetInfo, fdDetail, fdLoggedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [actionType, admin.userNum ?? 0, admin.username, admin.nickname, targetInfo, detail],
    );
  } catch (err) {
    console.warn('[gm-tools/logAction]', err.message);
  }
}

// Join utama untuk data player lengkap
const PLAYER_JOIN = `
  FROM userinfo ui
  LEFT JOIN userinfofrompublisher up
      ON (CAST(ui.fdUID AS CHAR) = CAST(up.fdUserID AS CHAR)
          OR CAST(ui.fdAuthUserNum AS CHAR) = CAST(up.fdUserID AS CHAR))
  LEFT JOIN userinfogame uig ON uig.fdUserNum = ui.fdUserNum
  LEFT JOIN tblblacklist bl
      ON bl.fdUserNum = ui.fdUserNum
      AND (bl.fdBlockEndDateTime IS NULL OR bl.fdBlockEndDateTime >= NOW())
  LEFT JOIN userinfologin ull ON ull.fdUserNum = ui.fdUserNum
`;

const PLAYER_SELECT = `
  SELECT
    ui.fdUserNum,
    CAST(up.fdUserID AS CHAR) AS UserId,
    ui.fdNickname,
    COALESCE(ui.fdRole, 'Player') AS RoleName,
    COALESCE(up.fdCash, 0) AS Cash,
    COALESCE(uig.fdGameMoney, 0) AS GameMoney,
    COALESCE(up.fdMau, 0)       AS Mau,
    COALESCE(uig.fdExp, 0)      AS Exp,
    CASE WHEN bl.fdUserNum IS NULL THEN 0 ELSE 1 END AS IsBanned,
    ull.fdLastLoginTime,
    ull.fdLastLogoutTime,
    ull.fdLoginCount
  ${PLAYER_JOIN}
`;

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats(req, res) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  try {
    const [[tp], [op], [tc], [tr], [pr]] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM userinfo'),
      query('SELECT COUNT(*) AS total FROM userinfologin WHERE COALESCE(fdServerNum, 0) > 0'),
      query('SELECT COALESCE(SUM(fdCash), 0) AS total FROM userinfofrompublisher'),
      query('SELECT COALESCE(SUM(fdGameMoney), 0) AS total FROM userinfogame'),
      query("SELECT COUNT(*) AS total FROM tblgm_requests WHERE fdStatus = 'Pending'"),
    ]);
    return json(res, 200, {
      totalPlayers:   Number(tp.total),
      onlinePlayers:  Number(op.total),
      totalCash:      Number(tc.total),
      totalTR:        Number(tr.total),
      pendingRequests:Number(pr.total),
    });
  } catch (err) {
    console.error('[gm/stats]', err.message);
    return json(res, 500, { message: 'Gagal memuat statistik.' });
  }
}

// ── Player search ─────────────────────────────────────────────────────────────

export async function searchPlayers(req, res) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const q = (req.query?.q ?? '').trim();
  if (!q) return json(res, 200, []);
  try {
    const kw = `%${q}%`;
    const rows = await query(
      `${PLAYER_SELECT} WHERE ui.fdNickname LIKE ? OR CAST(ui.fdUserNum AS CHAR) LIKE ?
          OR CAST(up.fdUserID AS CHAR) LIKE ?
       ORDER BY ui.fdInsertTime DESC LIMIT 30`,
      [kw, kw, kw],
    );
    return json(res, 200, rows);
  } catch (err) {
    console.error('[gm/searchPlayers]', err.message);
    return json(res, 500, { message: 'Gagal mencari player.' });
  }
}

// ── Player detail ─────────────────────────────────────────────────────────────

export async function getPlayerDetail(req, res, userNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  try {
    const rows = await query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [userNum]);
    if (!rows.length) return json(res, 404, { message: 'Player tidak ditemukan.' });
    return json(res, 200, rows[0]);
  } catch (err) {
    console.error('[gm/getPlayerDetail]', err.message);
    return json(res, 500, { message: 'Gagal memuat detail player.' });
  }
}

// ── Send Cash ─────────────────────────────────────────────────────────────────

export async function sendCash(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const amount = Number(req.body?.amount ?? 0);
  if (!amount || amount <= 0) return json(res, 400, { message: 'Jumlah cash harus lebih dari 0.' });
  try {
    const targets = await query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]);
    if (!targets.length) return json(res, 404, { message: 'Player target tidak ditemukan.' });

    if (isOwner(admin)) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          `UPDATE userinfofrompublisher up
           INNER JOIN userinfo ui ON (CAST(ui.fdUID AS CHAR) = CAST(up.fdUserID AS CHAR)
               OR CAST(ui.fdAuthUserNum AS CHAR) = CAST(up.fdUserID AS CHAR))
           SET up.fdCash = COALESCE(up.fdCash, 0) + ? WHERE ui.fdUserNum = ?`,
          [amount, targetUserNum],
        );
        await conn.commit();
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
      await logAction(admin, 'SEND_CASH', `UserNum:${targetUserNum}`, `Cash +${amount}`);
      return json(res, 200, { message: `Cash +${amount.toLocaleString('id-ID')} berhasil dikirim ke ${targets[0].fdNickname}.` });
    } else {
      await query(
        `INSERT INTO tblgm_requests
         (fdType, fdRequestedByUserNum, fdRequestedByUserId, fdRequestedByNickname,
          fdTargetUserNum, fdTargetUserId, fdTargetNickname, fdAmount, fdStatus, fdNote, fdRequestedAt)
         VALUES ('Cash', ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Request cash dari GM', NOW())`,
        [admin.userNum ?? 0, admin.username, admin.nickname,
         targetUserNum, targets[0].UserId ?? '', targets[0].fdNickname, amount],
      );
      return json(res, 200, { message: 'Request cash berhasil dikirim ke Owner.' });
    }
  } catch (err) {
    console.error('[gm/sendCash]', err.message);
    return json(res, 500, { message: err.message || 'Gagal mengirim cash.' });
  }
}

// ── Send TR ───────────────────────────────────────────────────────────────────

export async function sendTR(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const amount = Number(req.body?.amount ?? 0);
  if (!amount || amount <= 0) return json(res, 400, { message: 'Jumlah TR harus lebih dari 0.' });
  try {
    const targets = await query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]);
    if (!targets.length) return json(res, 404, { message: 'Player target tidak ditemukan.' });

    if (isOwner(admin)) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          `INSERT INTO userinfogame (fdUserNum, fdGameMoney) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE fdGameMoney = COALESCE(fdGameMoney, 0) + VALUES(fdGameMoney)`,
          [targetUserNum, amount],
        );
        await conn.commit();
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
      await logAction(admin, 'SEND_TR', `UserNum:${targetUserNum}`, `TR +${amount}`);
      return json(res, 200, { message: `TR +${amount.toLocaleString('id-ID')} berhasil dikirim ke ${targets[0].fdNickname}.` });
    } else {
      await query(
        `INSERT INTO tblgm_requests
         (fdType, fdRequestedByUserNum, fdRequestedByUserId, fdRequestedByNickname,
          fdTargetUserNum, fdTargetUserId, fdTargetNickname, fdAmount, fdStatus, fdNote, fdRequestedAt)
         VALUES ('TR', ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Request TR dari GM', NOW())`,
        [admin.userNum ?? 0, admin.username, admin.nickname,
         targetUserNum, targets[0].UserId ?? '', targets[0].fdNickname, amount],
      );
      return json(res, 200, { message: 'Request TR berhasil dikirim ke Owner.' });
    }
  } catch (err) {
    console.error('[gm/sendTR]', err.message);
    return json(res, 500, { message: err.message || 'Gagal mengirim TR.' });
  }
}

// ── Send MAU ──────────────────────────────────────────────────────────────────

export async function sendMau(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const amount = Number(req.body?.amount ?? 0);
  if (!amount || amount <= 0) return json(res, 400, { message: 'Jumlah MAU harus lebih dari 0.' });
  try {
    const targets = await query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]);
    if (!targets.length) return json(res, 404, { message: 'Player target tidak ditemukan.' });

    if (isOwner(admin)) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          `UPDATE userinfofrompublisher up
           INNER JOIN userinfo ui ON (CAST(ui.fdUID AS CHAR) = CAST(up.fdUserID AS CHAR)
               OR CAST(ui.fdAuthUserNum AS CHAR) = CAST(up.fdUserID AS CHAR))
           SET up.fdMau = COALESCE(up.fdMau, 0) + ? WHERE ui.fdUserNum = ?`,
          [amount, targetUserNum],
        );
        await conn.commit();
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
      await logAction(admin, 'SEND_MAU', `UserNum:${targetUserNum}`, `MAU +${amount}`);
      return json(res, 200, { message: `MAU +${amount.toLocaleString('id-ID')} berhasil dikirim ke ${targets[0].fdNickname}.` });
    } else {
      await query(
        `INSERT INTO tblgm_requests
         (fdType, fdRequestedByUserNum, fdRequestedByUserId, fdRequestedByNickname,
          fdTargetUserNum, fdTargetUserId, fdTargetNickname, fdAmount, fdStatus, fdNote, fdRequestedAt)
         VALUES ('Mau', ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Request MAU dari GM', NOW())`,
        [admin.userNum ?? 0, admin.username, admin.nickname,
         targetUserNum, targets[0].UserId ?? '', targets[0].fdNickname, amount],
      );
      return json(res, 200, { message: 'Request MAU berhasil dikirim ke Owner.' });
    }
  } catch (err) {
    console.error('[gm/sendMau]', err.message);
    return json(res, 500, { message: err.message || 'Gagal mengirim MAU.' });
  }
}

// ── Send EXP Player ───────────────────────────────────────────────────────────

export async function sendExp(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa menambah EXP player.' });
  const amount = Number(req.body?.amount ?? 0);
  if (!amount || amount <= 0) return json(res, 400, { message: 'Jumlah EXP harus lebih dari 0.' });
  try {
    const targets = await query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]);
    if (!targets.length) return json(res, 404, { message: 'Player target tidak ditemukan.' });
    await query(
      `INSERT INTO userinfogame (fdUserNum, fdExp) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE fdExp = COALESCE(fdExp, 0) + VALUES(fdExp)`,
      [targetUserNum, amount],
    );
    await logAction(admin, 'SEND_EXP', `UserNum:${targetUserNum}`, `EXP +${amount}`);
    return json(res, 200, { message: `EXP +${amount.toLocaleString('id-ID')} berhasil ditambahkan ke ${targets[0].fdNickname}.` });
  } catch (err) {
    console.error('[gm/sendExp]', err.message);
    return json(res, 500, { message: err.message || 'Gagal menambah EXP.' });
  }
}

// ── Send Item ─────────────────────────────────────────────────────────────────

export async function sendItem(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const itemNum  = Number(req.body?.itemNum ?? 0);
  const delivery = req.body?.delivery === 'Warehouse' ? 'Warehouse' : 'Giftbox';
  if (!itemNum) return json(res, 400, { message: 'Kode item wajib diisi.' });
  try {
    const [targets, items] = await Promise.all([
      query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]),
      query('SELECT fdItemNum, fdItemName FROM tblavataritemdesc WHERE fdItemNum = ? LIMIT 1', [itemNum]),
    ]);
    if (!targets.length) return json(res, 404, { message: 'Player target tidak ditemukan.' });
    if (!items.length)   return json(res, 404, { message: `Item #${itemNum} tidak ditemukan.` });
    const item = items[0];

    if (isOwner(admin)) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        if (delivery === 'Giftbox') {
          await conn.query(
            `INSERT INTO tblgift
             (fdSendUserNum, fdSendNickname, fdReceiveUserNum, fdGiftItemDescNum,
              fdNotified, fdSendDateTime, fdMemo, fdExpireDate)
             VALUES (?, ?, ?, ?, 0, NOW(), 'Hadiah dari Owner/GM', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [admin.userNum ?? 0, admin.nickname, targetUserNum, itemNum],
          );
        } else {
          await conn.query(
            `INSERT INTO userstoragekeepingitem (fdUserNum, fdItemNum, fdDateTime) VALUES (?, ?, NOW())`,
            [targetUserNum, itemNum],
          );
        }
        await conn.commit();
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
      await logAction(admin, 'SEND_ITEM', `UserNum:${targetUserNum}`, `Item:${itemNum} (${item.fdItemName}) -> ${delivery}`);
      return json(res, 200, { message: `"${item.fdItemName}" berhasil dikirim ke ${delivery} ${targets[0].fdNickname}.` });
    } else {
      await query(
        `INSERT INTO tblgm_requests
         (fdType, fdRequestedByUserNum, fdRequestedByUserId, fdRequestedByNickname,
          fdTargetUserNum, fdTargetUserId, fdTargetNickname,
          fdItemNum, fdItemName, fdDeliveryTarget, fdStatus, fdNote, fdRequestedAt)
         VALUES ('Item', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Request item dari GM', NOW())`,
        [admin.userNum ?? 0, admin.username, admin.nickname,
         targetUserNum, targets[0].UserId ?? '', targets[0].fdNickname,
         itemNum, item.fdItemName, delivery],
      );
      return json(res, 200, { message: 'Request item berhasil dikirim ke Owner.' });
    }
  } catch (err) {
    console.error('[gm/sendItem]', err.message);
    return json(res, 500, { message: err.message || 'Gagal mengirim item.' });
  }
}

// ── Ban / Unban ───────────────────────────────────────────────────────────────

export async function setBan(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa ban/unban player.' });
  const ban    = Boolean(req.body?.ban);
  const reason = String(req.body?.reason ?? '').trim() || (ban ? 'Dibanned oleh Owner' : 'Dibebaskan oleh Owner');
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM tblblacklist WHERE fdUserNum = ?', [targetUserNum]);
      if (ban) {
        await conn.query(
          `INSERT INTO tblblacklist
           (fdUserNum, fdBlockReasonNum, fdCommanderUserNum, fdCommandDateTime,
            fdBlockStartDateTime, fdBlockEndDateTime, fdReason)
           VALUES (?, 1, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 10 YEAR), ?)`,
          [targetUserNum, admin.userNum ?? 0, reason],
        );
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    await logAction(admin, ban ? 'BAN_PLAYER' : 'UNBAN_PLAYER', `UserNum:${targetUserNum}`, reason);
    return json(res, 200, { message: ban ? 'Player berhasil dibanned.' : 'Player berhasil di-unban.' });
  } catch (err) {
    console.error('[gm/setBan]', err.message);
    return json(res, 500, { message: err.message || 'Gagal memproses ban.' });
  }
}

// ── Update Role ───────────────────────────────────────────────────────────────

export async function setRole(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa mengubah role.' });
  const allowed = ['Player', 'GM', 'Staff', 'Owner'];
  const role = String(req.body?.role ?? '');
  if (!allowed.includes(role)) return json(res, 400, { message: 'Role tidak valid.' });
  try {
    await query('UPDATE userinfo SET fdRole = ? WHERE fdUserNum = ?', [role, targetUserNum]);
    await logAction(admin, 'UPDATE_ROLE', `UserNum:${targetUserNum}`, `Role -> ${role}`);
    return json(res, 200, { message: `Role berhasil diubah menjadi ${role}.` });
  } catch (err) {
    console.error('[gm/setRole]', err.message);
    return json(res, 500, { message: 'Gagal mengubah role.' });
  }
}

// ── Change Nickname ───────────────────────────────────────────────────────────

export async function setNickname(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa mengubah nickname.' });
  const nickname = String(req.body?.nickname ?? '').trim();
  if (!nickname || nickname.length < 2 || nickname.length > 50)
    return json(res, 400, { message: 'Nickname harus 2–50 karakter.' });
  try {
    await query('UPDATE userinfo SET fdNickname = ? WHERE fdUserNum = ?', [nickname, targetUserNum]);
    await logAction(admin, 'CHANGE_NICKNAME', `UserNum:${targetUserNum}`, `Nickname -> ${nickname}`);
    return json(res, 200, { message: `Nickname berhasil diubah menjadi "${nickname}".` });
  } catch (err) {
    console.error('[gm/setNickname]', err.message);
    return json(res, 500, { message: 'Gagal mengubah nickname.' });
  }
}

// ── Change Password ───────────────────────────────────────────────────────────

export async function setPassword(req, res, targetUserNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa mengubah password.' });
  const newPw = String(req.body?.newPassword ?? '');
  if (!newPw || newPw.length < 6) return json(res, 400, { message: 'Password minimal 6 karakter.' });
  try {
    const md5 = crypto.createHash('md5').update(newPw, 'utf8').digest('hex');
    await query(
      `UPDATE userinfofrompublisher up
       INNER JOIN userinfo ui ON (CAST(ui.fdUID AS CHAR) = CAST(up.fdUserID AS CHAR)
           OR CAST(ui.fdAuthUserNum AS CHAR) = CAST(up.fdUserID AS CHAR))
       SET up.fdPassword = ? WHERE ui.fdUserNum = ?`,
      [md5, targetUserNum],
    );
    await logAction(admin, 'CHANGE_PASSWORD', `UserNum:${targetUserNum}`, 'Password diubah oleh Owner');
    return json(res, 200, { message: 'Password berhasil diubah.' });
  } catch (err) {
    console.error('[gm/setPassword]', err.message);
    return json(res, 500, { message: 'Gagal mengubah password.' });
  }
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function getInventory(req, res, userNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const q = (req.query?.q ?? '').trim();
  let where = '';
  const params = [userNum];
  if (q) {
    where = 'AND (CAST(au.fdItemDescNum AS CHAR) LIKE ? OR COALESCE(ad.fdItemName, \'\') LIKE ?)';
    const kw = `%${q}%`;
    params.push(kw, kw);
  }
  try {
    const rows = await query(
      `SELECT
         au.fdNum, au.fdUserNum, au.fdItemDescNum,
         COALESCE(ad.fdItemName, CONCAT('Item #', CAST(au.fdItemDescNum AS CHAR))) AS ItemName,
         COALESCE(au.fdCharacter, 0) AS fdCharacter,
         COALESCE(au.fdExp, 0) AS fdExp,
         CASE WHEN CAST(au.fdExpireDateTime AS CHAR) = '0000-00-00 00:00:00' THEN NULL ELSE au.fdExpireDateTime END AS fdExpireDateTime,
         COALESCE(au.fdCount, 0) AS fdCount,
         COALESCE(au.fdUsing, 0) AS fdUsing,
         au.fdGotDateTime
       FROM tblavataruser au
       LEFT JOIN tblavataritemdesc ad ON ad.fdItemNum = au.fdItemDescNum
       WHERE au.fdUserNum = ? ${where}
       ORDER BY au.fdNum DESC LIMIT 300`,
      params,
    );
    return json(res, 200, rows);
  } catch (err) {
    console.error('[gm/getInventory]', err.message);
    return json(res, 500, { message: 'Gagal memuat inventory.' });
  }
}

export async function deleteInventoryItem(req, res, targetUserNum, invNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  try {
    const items = await query(
      'SELECT fdNum, fdItemDescNum FROM tblavataruser WHERE fdNum = ? AND fdUserNum = ? LIMIT 1',
      [invNum, targetUserNum],
    );
    if (!items.length) return json(res, 404, { message: 'Item inventory tidak ditemukan.' });

    if (isOwner(admin)) {
      await query('DELETE FROM tblavataruser WHERE fdNum = ? AND fdUserNum = ?', [invNum, targetUserNum]);
      await logAction(admin, 'DELETE_INVENTORY', `UserNum:${targetUserNum}`,
        `Hapus fdNum:${invNum} item:${items[0].fdItemDescNum}`);
      return json(res, 200, { message: 'Item inventory berhasil dihapus.' });
    } else {
      const [targets, descs] = await Promise.all([
        query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]),
        query('SELECT fdItemName FROM tblavataritemdesc WHERE fdItemNum = ? LIMIT 1', [items[0].fdItemDescNum]),
      ]);
      if (!targets.length) return json(res, 404, { message: 'Player tidak ditemukan.' });
      const itemName = descs[0]?.fdItemName ?? `Item #${items[0].fdItemDescNum}`;
      await query(
        `INSERT INTO tblgm_requests
         (fdType, fdRequestedByUserNum, fdRequestedByUserId, fdRequestedByNickname,
          fdTargetUserNum, fdTargetUserId, fdTargetNickname,
          fdItemNum, fdItemName, fdStatus, fdNote, fdRequestedAt)
         VALUES ('InventoryDelete', ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())`,
        [admin.userNum ?? 0, admin.username, admin.nickname,
         targetUserNum, targets[0].UserId ?? '', targets[0].fdNickname,
         items[0].fdItemDescNum, itemName,
         `InventoryNum:${invNum} | Request hapus inventory dari GM`],
      );
      return json(res, 200, { message: 'Request hapus inventory berhasil dikirim ke Owner.' });
    }
  } catch (err) {
    console.error('[gm/deleteInventory]', err.message);
    return json(res, 500, { message: 'Gagal memproses permintaan.' });
  }
}

export async function extendInventoryExp(req, res, targetUserNum, invNum) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const expAmount = Number(req.body?.expAmount ?? 0);
  if (!expAmount || expAmount <= 0 || expAmount > 1_000_000_000)
    return json(res, 400, { message: 'Nilai exp tidak valid (1 – 1.000.000.000).' });
  try {
    const items = await query(
      'SELECT fdNum, fdItemDescNum FROM tblavataruser WHERE fdNum = ? AND fdUserNum = ? LIMIT 1',
      [invNum, targetUserNum],
    );
    if (!items.length) return json(res, 404, { message: 'Item inventory tidak ditemukan.' });

    if (isOwner(admin)) {
      await query(
        `UPDATE tblavataruser
         SET fdExp = COALESCE(fdExp, 0) + ?, fdExpireDateTime = '2099-12-31 23:59:59'
         WHERE fdNum = ? AND fdUserNum = ?`,
        [expAmount, invNum, targetUserNum],
      );
      await logAction(admin, 'EXTEND_INVENTORY_EXP', `UserNum:${targetUserNum}`,
        `fdNum:${invNum} +${expAmount} exp, set permanent`);
      return json(res, 200, { message: `Exp +${expAmount.toLocaleString('id-ID')} ditambah dan masa berlaku diset permanen.` });
    } else {
      const [targets, descs] = await Promise.all([
        query(`${PLAYER_SELECT} WHERE ui.fdUserNum = ? LIMIT 1`, [targetUserNum]),
        query('SELECT fdItemName FROM tblavataritemdesc WHERE fdItemNum = ? LIMIT 1', [items[0].fdItemDescNum]),
      ]);
      if (!targets.length) return json(res, 404, { message: 'Player tidak ditemukan.' });
      const itemName = descs[0]?.fdItemName ?? `Item #${items[0].fdItemDescNum}`;
      await query(
        `INSERT INTO tblgm_requests
         (fdType, fdRequestedByUserNum, fdRequestedByUserId, fdRequestedByNickname,
          fdTargetUserNum, fdTargetUserId, fdTargetNickname,
          fdAmount, fdItemNum, fdItemName, fdStatus, fdNote, fdRequestedAt)
         VALUES ('InventoryExtend', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())`,
        [admin.userNum ?? 0, admin.username, admin.nickname,
         targetUserNum, targets[0].UserId ?? '', targets[0].fdNickname,
         expAmount, items[0].fdItemDescNum, itemName,
         `InventoryNum:${invNum} | Request tambah exp dari GM`],
      );
      return json(res, 200, { message: 'Request perpanjang exp berhasil dikirim ke Owner.' });
    }
  } catch (err) {
    console.error('[gm/extendInventory]', err.message);
    return json(res, 500, { message: 'Gagal memproses permintaan.' });
  }
}

// ── GM Requests ───────────────────────────────────────────────────────────────

export async function getRequests(req, res) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  try {
    const where  = isOwner(admin) ? '' : 'WHERE fdRequestedByUserId = ?';
    const params = isOwner(admin) ? [] : [admin.username];
    const rows = await query(
      `SELECT fdRequestId, fdType,
              fdRequestedByUserId, fdRequestedByNickname,
              fdTargetUserNum, fdTargetUserId, fdTargetNickname,
              COALESCE(fdAmount, 0) AS fdAmount,
              fdItemNum, fdItemName,
              COALESCE(fdDeliveryTarget, '') AS fdDeliveryTarget,
              fdStatus, COALESCE(fdNote, '') AS fdNote,
              fdRequestedAt, fdReviewedAt
       FROM tblgm_requests ${where}
       ORDER BY CASE WHEN fdStatus = 'Pending' THEN 0 ELSE 1 END, fdRequestedAt DESC
       LIMIT 200`,
      params,
    );
    return json(res, 200, rows);
  } catch (err) {
    console.error('[gm/getRequests]', err.message);
    return json(res, 500, { message: 'Gagal memuat requests.' });
  }
}

export async function approveRequest(req, res, requestId) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa approve request.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT * FROM tblgm_requests WHERE fdRequestId = ? FOR UPDATE`, [requestId],
    );
    const request = Array.isArray(rows) ? rows[0] : rows;
    if (!request) { await conn.rollback(); return json(res, 404, { message: 'Request tidak ditemukan.' }); }
    if (request.fdStatus !== 'Pending') { await conn.rollback(); return json(res, 400, { message: 'Request sudah diproses.' }); }

    const target = Number(request.fdTargetUserNum);
    const type   = String(request.fdType);

    if (type === 'Cash') {
      await conn.query(
        `UPDATE userinfofrompublisher up
         INNER JOIN userinfo ui ON (CAST(ui.fdUID AS CHAR) = CAST(up.fdUserID AS CHAR)
             OR CAST(ui.fdAuthUserNum AS CHAR) = CAST(up.fdUserID AS CHAR))
         SET up.fdCash = COALESCE(up.fdCash, 0) + ? WHERE ui.fdUserNum = ?`,
        [request.fdAmount, target],
      );
    } else if (type === 'TR') {
      await conn.query(
        `INSERT INTO userinfogame (fdUserNum, fdGameMoney) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE fdGameMoney = COALESCE(fdGameMoney, 0) + VALUES(fdGameMoney)`,
        [target, request.fdAmount],
      );
    } else if (type === 'Mau') {
      await conn.query(
        `UPDATE userinfofrompublisher up
         INNER JOIN userinfo ui ON (CAST(ui.fdUID AS CHAR) = CAST(up.fdUserID AS CHAR)
             OR CAST(ui.fdAuthUserNum AS CHAR) = CAST(up.fdUserID AS CHAR))
         SET up.fdMau = COALESCE(up.fdMau, 0) + ? WHERE ui.fdUserNum = ?`,
        [request.fdAmount, target],
      );
    } else if (type === 'Item') {
      const delivery = request.fdDeliveryTarget === 'Warehouse' ? 'Warehouse' : 'Giftbox';
      if (delivery === 'Giftbox') {
        await conn.query(
          `INSERT INTO tblgift (fdSendUserNum, fdSendNickname, fdReceiveUserNum, fdGiftItemDescNum,
           fdNotified, fdSendDateTime, fdMemo, fdExpireDate)
           VALUES (?, ?, ?, ?, 0, NOW(), 'Diapprove oleh Owner', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
          [admin.userNum ?? 0, admin.nickname, target, request.fdItemNum],
        );
      } else {
        await conn.query(
          `INSERT INTO userstoragekeepingitem (fdUserNum, fdItemNum, fdDateTime) VALUES (?, ?, NOW())`,
          [target, request.fdItemNum],
        );
      }
    } else if (type === 'InventoryDelete') {
      const m = String(request.fdNote ?? '').match(/InventoryNum:(\d+)/);
      if (m) await conn.query('DELETE FROM tblavataruser WHERE fdNum = ? AND fdUserNum = ?', [m[1], target]);
    } else if (type === 'InventoryExtend') {
      const m = String(request.fdNote ?? '').match(/InventoryNum:(\d+)/);
      if (m) {
        await conn.query(
          `UPDATE tblavataruser SET fdExp = COALESCE(fdExp,0) + ?, fdExpireDateTime = '2099-12-31 23:59:59'
           WHERE fdNum = ? AND fdUserNum = ?`,
          [request.fdAmount, m[1], target],
        );
      }
    }

    await conn.query(
      `UPDATE tblgm_requests SET fdStatus = 'Approved', fdReviewedByUserNum = ?, fdReviewedAt = NOW()
       WHERE fdRequestId = ?`,
      [admin.userNum ?? 0, requestId],
    );
    await conn.commit();
    await logAction(admin, 'APPROVE_REQUEST', `Request:${requestId}`, `Approve ${type}`);
    return json(res, 200, { message: `Request ${type} berhasil di-approve dan dieksekusi.` });
  } catch (err) {
    await conn.rollback();
    console.error('[gm/approveRequest]', err.message);
    return json(res, 500, { message: err.message || 'Gagal approve request.' });
  } finally { conn.release(); }
}

export async function rejectRequest(req, res, requestId) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  if (!isOwner(admin)) return json(res, 403, { message: 'Hanya Owner yang bisa reject request.' });
  const note = String(req.body?.note ?? '').trim() || 'Ditolak oleh Owner';
  try {
    const result = await query(
      `UPDATE tblgm_requests
       SET fdStatus = 'Rejected', fdReviewedByUserNum = ?, fdReviewedAt = NOW(),
           fdNote = CONCAT(COALESCE(fdNote, ''), ' | Reject: ', ?)
       WHERE fdRequestId = ? AND fdStatus = 'Pending'`,
      [admin.userNum ?? 0, note, requestId],
    );
    if (!result.affectedRows) return json(res, 400, { message: 'Request tidak ditemukan atau sudah diproses.' });
    await logAction(admin, 'REJECT_REQUEST', `Request:${requestId}`, note);
    return json(res, 200, { message: 'Request berhasil ditolak.' });
  } catch (err) {
    console.error('[gm/rejectRequest]', err.message);
    return json(res, 500, { message: 'Gagal reject request.' });
  }
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export async function getLogs(req, res) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  try {
    const where  = isOwner(admin) ? '' : 'WHERE fdActorUserId = ?';
    const params = isOwner(admin) ? [] : [admin.username];
    const rows = await query(
      `SELECT fdLogId, fdActionType, fdActorUserId, fdActorNickname, fdTargetInfo, fdDetail, fdLoggedAt
       FROM tbladmin_action_log ${where}
       ORDER BY fdLoggedAt DESC LIMIT 300`,
      params,
    );
    return json(res, 200, rows);
  } catch (err) {
    console.error('[gm/getLogs]', err.message);
    return json(res, 500, { message: 'Gagal memuat log.' });
  }
}

// ── Item search ───────────────────────────────────────────────────────────────

export async function searchGmItems(req, res) {
  const admin = getAdminUser(req);
  if (!admin) return json(res, 401, { message: 'Akses ditolak.' });
  const q = (req.query?.q ?? '').trim();
  if (!q) return json(res, 200, []);
  const kw = `%${q}%`;
  try {
    const rows = await query(
      `SELECT fdItemNum, fdItemName FROM tblavataritemdesc
       WHERE CAST(fdItemNum AS CHAR) LIKE ? OR fdItemName LIKE ?
       ORDER BY fdItemNum LIMIT 50`,
      [kw, kw],
    );
    return json(res, 200, rows);
  } catch (err) {
    console.error('[gm/searchItems]', err.message);
    return json(res, 500, { message: 'Gagal mencari item.' });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function gmToolsRouter(req, res, next) {
  const urlPath  = (req.url ?? '').split('?')[0];
  const segments = urlPath.replace(/^\//, '').split('/').filter(Boolean);
  const [resource, id, sub, subId, subAction] = segments;
  const m = req.method;

  if (resource === 'stats'   && m === 'GET') return getStats(req, res);
  if (resource === 'items'   && m === 'GET') return searchGmItems(req, res);
  if (resource === 'logs'    && m === 'GET') return getLogs(req, res);

  if (resource === 'players') {
    if (!id  && m === 'GET') return searchPlayers(req, res);
    if ( id && !sub && m === 'GET') return getPlayerDetail(req, res, Number(id));
    if ( id && sub === 'cash'      && m === 'POST')   return sendCash(req, res, Number(id));
    if ( id && sub === 'tr'        && m === 'POST')   return sendTR(req, res, Number(id));
    if ( id && sub === 'mau'       && m === 'POST')   return sendMau(req, res, Number(id));
    if ( id && sub === 'exp'       && m === 'POST')   return sendExp(req, res, Number(id));
    if ( id && sub === 'item'      && m === 'POST')   return sendItem(req, res, Number(id));
    if ( id && sub === 'ban'       && m === 'PATCH')  return setBan(req, res, Number(id));
    if ( id && sub === 'role'      && m === 'PATCH')  return setRole(req, res, Number(id));
    if ( id && sub === 'nickname'  && m === 'PATCH')  return setNickname(req, res, Number(id));
    if ( id && sub === 'password'  && m === 'PATCH')  return setPassword(req, res, Number(id));
    if ( id && sub === 'inventory' && !subId  && m === 'GET')    return getInventory(req, res, Number(id));
    if ( id && sub === 'inventory' &&  subId  && !subAction && m === 'DELETE')
      return deleteInventoryItem(req, res, Number(id), Number(subId));
    if ( id && sub === 'inventory' &&  subId  && subAction === 'extend' && m === 'PATCH')
      return extendInventoryExp(req, res, Number(id), Number(subId));
  }

  if (resource === 'requests') {
    if (!id && m === 'GET') return getRequests(req, res);
    if ( id && sub === 'approve' && m === 'POST') return approveRequest(req, res, Number(id));
    if ( id && sub === 'reject'  && m === 'POST') return rejectRequest(req, res, Number(id));
  }

  next();
}
