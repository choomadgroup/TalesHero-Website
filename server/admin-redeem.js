// ============================================================
//  Tales Hero Indonesia — Admin Redeem Code CRUD
//  GET    /api/admin/redeem        — list semua kode
//  POST   /api/admin/redeem        — buat kode baru (multi-item)
//  PATCH  /api/admin/redeem/:id    — nonaktifkan / aktifkan
//  DELETE /api/admin/redeem/:id    — hapus kode
// ============================================================

import { query } from './db.js';
import { getAdminUser } from './admin-session.js';

// ── Auto-migrate: tambah fdRewardItems jika belum ada ─────────
export async function migrateRedeemTable() {
  try {
    await query(
      `ALTER TABLE tblredeem_code ADD COLUMN fdRewardItems TEXT NULL AFTER fdDeliveryTarget`,
    );
    console.log('[admin-redeem] Added fdRewardItems column to tblredeem_code');
  } catch (err) {
    // Kolom sudah ada — bukan error
    if (!err.message?.includes('Duplicate column')) {
      console.warn('[admin-redeem/migrate]', err.message);
    }
  }
}

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
              fdRewardItemNum, fdRewardItemName, fdDeliveryTarget, fdRewardItems,
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
      cash_amount   = 0,
      tr_amount     = 0,
      mau_amount    = 0,
      items         = [],          // array of { num, name, delivery }
      // legacy single-item fields (backward compat)
      item_num      = 0,
      item_name     = '',
      delivery_target = 'Giftbox',
      note          = '',
      expires_days  = 7,
    } = req.body ?? {};

    const cash = Number(cash_amount) || 0;
    const tr   = Number(tr_amount)   || 0;
    const mau  = Number(mau_amount)  || 0;

    // Normalise items array — support both new `items` array and legacy single-item
    let rewardItems = [];
    if (Array.isArray(items) && items.length > 0) {
      rewardItems = items
        .filter(it => Number(it.num) > 0)
        .map(it => ({
          num:      Number(it.num),
          name:     String(it.name ?? '').trim() || `Item #${it.num}`,
          delivery: it.delivery === 'Warehouse' ? 'Warehouse' : 'Giftbox',
        }));
    } else if (Number(item_num) > 0) {
      rewardItems = [{
        num:      Number(item_num),
        name:     String(item_name ?? '').trim() || `Item #${item_num}`,
        delivery: delivery_target === 'Warehouse' ? 'Warehouse' : 'Giftbox',
      }];
    }

    // Validasi reward — minimal salah satu harus diisi
    if (cash <= 0 && tr <= 0 && mau <= 0 && rewardItems.length === 0) {
      return res.status(400).json({ message: 'Isi minimal satu reward: Cash, TR, MAU, atau Item.' });
    }

    // Resolve kode — generate kalau kosong
    let code = (rawCode ?? '').trim().toUpperCase();
    if (!code) {
      for (let i = 0; i < 10; i++) {
        const candidate = generateCode();
        const existing = await query(
          `SELECT fdRedeemId FROM tblredeem_code WHERE fdCode = ? LIMIT 1`,
          [candidate],
        );
        if (existing.length === 0) { code = candidate; break; }
      }
    } else {
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
    const days      = Math.max(1, Math.min(365, Number(expires_days) || 7));
    const expiredAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Ambil UserNum admin dari database game
    const creatorUserNum = await getUserNumByUsername(admin.username);

    // Resolve item names jika name kosong
    for (const it of rewardItems) {
      if (!it.name || it.name === `Item #${it.num}`) {
        const rows = await query(
          `SELECT fdItemName FROM tblavataritemdesc WHERE fdItemNum = ? LIMIT 1`,
          [it.num],
        );
        if (rows[0]?.fdItemName) it.name = rows[0].fdItemName;
      }
    }

    // Untuk kolom legacy, simpan item pertama
    const firstItem   = rewardItems[0] ?? null;
    const legacyNum   = firstItem?.num   ?? null;
    const legacyName  = firstItem?.name  ?? null;
    const legacyDel   = firstItem?.delivery ?? null;
    // JSON untuk multi-item (null jika 0 item)
    const itemsJson   = rewardItems.length > 0 ? JSON.stringify(rewardItems) : null;

    await query(
      `INSERT INTO tblredeem_code
         (fdCode, fdRewardCash, fdRewardTR, fdRewardMAU,
          fdRewardItemNum, fdRewardItemName, fdDeliveryTarget, fdRewardItems,
          fdNote, fdIsActive, fdClaimCount,
          fdCreatedByUserNum, fdCreatedByUserId, fdCreatedByNickname,
          fdExpiredAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`,
      [
        code, cash, tr, mau,
        legacyNum, legacyName, legacyDel, itemsJson,
        note.trim() || null,
        creatorUserNum, admin.username, admin.nickname,
        expiredAt,
      ],
    );

    const [created] = await query(
      `SELECT fdRedeemId, fdCode, fdRewardCash, fdRewardTR, COALESCE(fdRewardMAU, 0) AS fdRewardMAU,
              fdRewardItemNum, fdRewardItemName, fdDeliveryTarget, fdRewardItems,
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
