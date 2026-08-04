// ============================================================
//  Tales Hero Indonesia — Ganti Nickname
//  POST /auth/change-nickname
//
//  Body JSON: { nickname, payMethod }
//  payMethod: 'tr' | 'cash' | 'mau'
//
//  Harga:  TR  200.000  |  Cash  150.000  |  MAU  78.000
//  Syarat: minimal 5 karakter, alfanumerik + spasi + underscore,
//          tidak mengandung kata toxic / badwords.
// ============================================================

import { query } from '../db.js';
import { getSessionUsername } from './session.js';

// ── Biaya per metode pembayaran ──────────────────────────────
const PRICE = { tr: 200_000, cash: 150_000, mau: 78_000 };

// ── Daftar badwords / kata tidak pantas ─────────────────────
const BADWORDS = [
  // Indonesian
  'anjing','anjir','babi','bangsat','bajingan','brengsek','sialan','goblok',
  'tolol','idiot','bodoh','asu','kampret','memek','kontol','ngentot','jancok',
  'cok','tai','taik','pepek','titit','genjot','ngentod','pelacur','sundal',
  'lonte','bajing','setan','iblis','keparat','bejat','bokep','bugil',
  // English
  'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy','cock',
  'nigger','faggot','retard','whore','slut',
];

function containsBadword(str) {
  const lower = str.toLowerCase().replace(/\s+/g, '');
  return BADWORDS.some(w => lower.includes(w));
}

// ── Validasi nickname ────────────────────────────────────────
function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') return 'Nickname tidak boleh kosong.';
  const trimmed = nickname.trim();
  if (trimmed.length < 5)  return 'Nickname minimal 5 karakter.';
  if (trimmed.length > 20) return 'Nickname maksimal 20 karakter.';
  if (!/^[a-zA-Z0-9 _]+$/.test(trimmed)) return 'Nickname hanya boleh mengandung huruf, angka, spasi, dan underscore.';
  if (containsBadword(trimmed)) return 'Nickname mengandung kata yang tidak diperbolehkan.';
  return null; // valid
}

async function changeNickname(req, res) {
  try {
    const username = await getSessionUsername(req);
    if (!username)
      return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });

    const { nickname, payMethod } = req.body ?? {};

    // ── 1. Validasi input ─────────────────────────────────
    const nicknameError = validateNickname(nickname);
    if (nicknameError) return res.status(400).json({ message: nicknameError });

    const method = String(payMethod ?? '').toLowerCase();
    if (!PRICE[method])
      return res.status(400).json({ message: 'Metode pembayaran tidak valid.' });

    const price = PRICE[method];
    const newNickname = nickname.trim();

    // ── 2. Ambil data user (balance + userNum) ────────────
    const rows = await query(
      `SELECT g.fdCash, ig.fdGameMoney, i.fdUserNum,
              COALESCE(uip.fdPoint, 0) AS mauPoint
       FROM userinfofrompublisher g
       LEFT JOIN userinfo i ON i.fdUID = g.fdUserID
       LEFT JOIN userinfogame ig ON ig.fdUserNum = i.fdUserNum
       LEFT JOIN userinfopoint uip
         ON uip.fdUserNum = i.fdUserNum AND uip.fdRewardCondition = 1201
       WHERE g.fdUserID = ?
       LIMIT 1`,
      [username],
    );

    if (!rows.length) return res.status(404).json({ message: 'Akun tidak ditemukan.' });

    const { fdCash, fdGameMoney, fdUserNum, mauPoint } = rows[0];

    // ── 3. Cek saldo cukup ────────────────────────────────
    if (method === 'cash' && Number(fdCash) < price)
      return res.status(400).json({ message: `Cash tidak cukup. Dibutuhkan ${price.toLocaleString('id-ID')} Cash.` });
    if (method === 'tr' && Number(fdGameMoney) < price)
      return res.status(400).json({ message: `TR tidak cukup. Dibutuhkan ${price.toLocaleString('id-ID')} TR.` });
    if (method === 'mau' && Number(mauPoint) < price)
      return res.status(400).json({ message: `MAU tidak cukup. Dibutuhkan ${price.toLocaleString('id-ID')} MAU.` });

    // ── 4. Kurangi saldo ──────────────────────────────────
    if (method === 'cash') {
      await query(
        `UPDATE userinfofrompublisher SET fdCash = fdCash - ? WHERE fdUserID = ?`,
        [price, username],
      );
    } else if (method === 'tr') {
      await query(
        `UPDATE userinfogame ig
         JOIN userinfo i ON ig.fdUserNum = i.fdUserNum
         SET ig.fdGameMoney = ig.fdGameMoney - ?
         WHERE i.fdUID = ?`,
        [price, username],
      );
    } else if (method === 'mau') {
      await query(
        `UPDATE userinfopoint
         SET fdPoint = fdPoint - ?
         WHERE fdUserNum = ? AND fdRewardCondition = 1201`,
        [price, fdUserNum],
      );
    }

    // ── 5. Update nickname ────────────────────────────────
    await query(
      `UPDATE userinfo SET fdNickname = ? WHERE fdUID = ?`,
      [newNickname, username],
    );

    return res.status(200).json({
      message: `Nickname berhasil diubah menjadi "${newNickname}".`,
      nickname: newNickname,
    });

  } catch (err) {
    console.error('[change-nickname] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

export default changeNickname;
