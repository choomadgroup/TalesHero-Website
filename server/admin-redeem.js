// ============================================================
//  Tales Hero Indonesia — Admin Redeem Code CRUD
//  GET    /api/admin/redeem        — list semua kode
//  POST   /api/admin/redeem        — buat kode baru
//  PATCH  /api/admin/redeem/:id    — nonaktifkan / aktifkan
// ============================================================

import { query } from './db.js';
import { getAdminUser } from './admin-session.js';

// ── Helpers ───────────────────────────────────────────────────

function rand(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateCode() {
  return `TRH-${rand(4)}-${rand(4)}`;
}

async function getUserNumByUsername(username) {
  const rows = await query(
    `SELECT fdUserNum FROM userinfo WHERE fdUID = ? LIMIT 1`,
    [username],
  );
  return rows[0]?.fdUserNum ?? 0;
}

// ── GET /api/admin/redeem — list semua kode ───────────────────
export async function adminGetRedeemCodes(req, res) {
  try {
    const admin = getAdminUser(req);
    if (!admin) return res.status(401).json({ message: 'Akses ditolak.' });

    // Auto-cleanup: hapus kode yang sudah kedaluwarsa atau dinonaktifkan
    await query(
      `DELETE FROM tblredeem_code
       WHERE fdIsActive = 0 OR (fdExpiredAt IS NOT NULL AND fdExpiredAt < NOW())`,
    ).catch(err => console.warn('[admin-redeem/auto-cleanup]', err.message));

    const codes = await query(
      `SELECT fdRedeemId, fdCode,
              fdRewardCash, fdRewardTR, COALESCE(fdRewardMAU, 0) AS fdRewardMAU,
              fdRewardItemNum, fdRewardItemName, fdDeliveryTarget,
              fdNote, fdIsActive, fdClaimCount,
              fdCreatedByNickname, fdCreatedAt, fdExpiredAt
       FROM tblredeem_code
       ORDER BY fdCreatedAt DESC
       LIMIT 200`,
    );

    return res.status(200).json(codes);
  } catch (err) {
    console.error('[admin-redeem/list]', err);
    return res.status(500).json({ message: 'Gagal memuat daftar kode.' });
  }
}

// ── DELETE /api/admin/redeem/:id — hapus kode ─────────────────
export async function adminDeleteRedeemCode(req, res) {
  try {
    const admin = getAdminUser(req);
    if (!admin) return res.status(401).json({ message: 'Akses ditolak.' });
    if (admin.role !== 'Owner') {
      return res.status(403).json({ message: 'Hanya Owner yang bisa menghapus kode redeem.' });
    }

    const id = Number(req.params?.id ?? 0);
    if (!id) return res.status(400).json({ message: 'ID tidak valid.' });

    const rows = await query(
      `SELECT fdRedeemId FROM tblredeem_code WHERE fdRedeemId = ? LIMIT 1`,
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Kode tidak ditemukan.' });

    await query(`DELETE FROM tblredeem_code WHERE fdRedeemId = ?`, [id]);

    return res.status(200).json({ message: 'Kode berhasil dihapus.' });
  } catch (err) {
    console.error('[admin-redeem/delete]', err);
    return res.status(500).json({ message: 'Gagal menghapus kode.' });
  }
}

// ── POST /api/admin/redeem — buat kode baru ───────────────────
export async function adminCreateRedeemCode(req, res) {
  try {
    const admin = getAdminUser(req);
    if (!admin) return res.status(401).json({ message: 'Akses ditolak.' });
    if (admin.role !== 'Owner') {
      return res.status(403).json({ message: 'Hanya Owner yang bisa membuat kode redeem.' });
    }

    const {
      code: rawCode,
      cash_amount = 0,
      tr_amount   = 0,
      mau_amount  = 0,
      item_num    = 0,
      item_name   = '',
      delivery_target = 'Giftbox',
      note        = '',
      expires_days = 3,
    } = req.body ?? {};

    // Validasi reward — minimal salah satu harus diisi
    const cash   = Number(cash_amount)  || 0;
    const tr     = Number(tr_amount)    || 0;
    const mau    = Number(mau_amount)   || 0;
    const itemNum = Number(item_num)    || 0;
    if (cash <= 0 && tr <= 0 && mau <= 0 && itemNum <= 0) {
      return res.status(400).json({ message: 'Isi minimal satu reward: Cash, TR, MAU, atau Item.' });
    }

    // Resolve kode — generate kalau kosong
    let code = (rawCode ?? '').trim().toUpperCase();
    if (!code) {
      // Pastikan unik
      for (let i = 0; i < 10; i++) {
        const candidate = generateCode();
        const existing = await query(
          `SELECT fdRedeemId FROM tblredeem_code WHERE fdCode = ? LIMIT 1`,
          [candidate],
        );
        if (existing.length === 0) { code = candidate; break; }
      }
    } else {
      // Cek duplikat manual
      const existing = await query(
        `SELECT fdRedeemId FROM tblredeem_code WHERE fdCode = ? LIMIT 1`,
        [code],
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: `Kode "${code}" sudah ada. Gunakan kode lain.` });
      }
      if (!/^[A-Z0-9\-_]{3,64}$/.test(code)) {
        return res.status(400).json({ message: 'Format kode tidak valid. Gunakan huruf kapital, angka, tanda hubung, atau garis bawah.' });
      }
    }

    // Hitung expired
    const days   = Math.max(1, Math.min(365, Number(expires_days) || 3));
    const expiredAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Ambil UserNum admin dari database game
    const creatorUserNum = await getUserNumByUsername(admin.username);

    // Resolve item name jika ada itemNum tapi name kosong
    let resolvedItemName = (item_name ?? '').trim();
    if (itemNum > 0 && !resolvedItemName) {
      const itemRows = await query(
        `SELECT fdItemName FROM tblavataritemdesc WHERE fdItemNum = ? LIMIT 1`,
        [itemNum],
      );
      resolvedItemName = itemRows[0]?.fdItemName ?? `Item #${itemNum}`;
    }

    await query(
      `INSERT INTO tblredeem_code
         (fdCode, fdRewardCash, fdRewardTR, fdRewardMAU,
          fdRewardItemNum, fdRewardItemName, fdDeliveryTarget,
          fdNote, fdIsActive, fdClaimCount,
          fdCreatedByUserNum, fdCreatedByUserId, fdCreatedByNickname,
          fdExpiredAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`,
      [
        code,
        cash,
        tr,
        mau,
        itemNum || null,
        itemNum ? resolvedItemName : null,
        itemNum ? (delivery_target === 'Warehouse' ? 'Warehouse' : 'Giftbox') : null,
        note.trim() || null,
        creatorUserNum,
        admin.username,
        admin.nickname,
        expiredAt,
      ],
    );

    const [created] = await query(
      `SELECT fdRedeemId, fdCode, fdRewardCash, fdRewardTR, COALESCE(fdRewardMAU, 0) AS fdRewardMAU,
              fdRewardItemNum, fdRewardItemName, fdDeliveryTarget,
              fdNote, fdIsActive, fdClaimCount,
              fdCreatedByNickname, fdCreatedAt, fdExpiredAt
       FROM tblredeem_code WHERE fdCode = ? LIMIT 1`,
      [code],
    );

    return res.status(201).json(created);
  } catch (err) {
    console.error('[admin-redeem/create]', err);
    return res.status(500).json({ message: 'Gagal membuat kode redeem.' });
  }
}

// ── PATCH /api/admin/redeem/:id — toggle aktif/nonaktif ───────
export async function adminToggleRedeemCode(req, res) {
  try {
    const admin = getAdminUser(req);
    if (!admin) return res.status(401).json({ message: 'Akses ditolak.' });
    if (admin.role !== 'Owner') {
      return res.status(403).json({ message: 'Hanya Owner yang bisa mengubah status kode.' });
    }

    const id = Number(req.params?.id ?? 0);
    if (!id) return res.status(400).json({ message: 'ID tidak valid.' });

    const rows = await query(
      `SELECT fdRedeemId, fdIsActive FROM tblredeem_code WHERE fdRedeemId = ? LIMIT 1`,
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Kode tidak ditemukan.' });

    const newActive = rows[0].fdIsActive ? 0 : 1;
    await query(
      `UPDATE tblredeem_code SET fdIsActive = ? WHERE fdRedeemId = ?`,
      [newActive, id],
    );

    return res.status(200).json({ fdRedeemId: id, fdIsActive: newActive });
  } catch (err) {
    console.error('[admin-redeem/toggle]', err);
    return res.status(500).json({ message: 'Gagal mengubah status kode.' });
  }
}

// ── GET /api/admin/redeem/search-item?q=... — cari item ───────
export async function adminSearchItem(req, res) {
  try {
    const admin = getAdminUser(req);
    if (!admin) return res.status(401).json({ message: 'Akses ditolak.' });

    const q = (req.query?.q ?? '').trim();
    if (!q || q.length < 2) return res.status(200).json([]);

    const isNum = /^\d+$/.test(q);
    const items = await query(
      isNum
        ? `SELECT fdItemNum, fdItemName FROM tblavataritemdesc WHERE fdItemNum = ? LIMIT 20`
        : `SELECT fdItemNum, fdItemName FROM tblavataritemdesc WHERE fdItemName LIKE ? LIMIT 20`,
      [isNum ? Number(q) : `%${q}%`],
    );

    return res.status(200).json(items);
  } catch (err) {
    console.error('[admin-redeem/search-item]', err);
    return res.status(500).json({ message: 'Gagal mencari item.' });
  }
}
