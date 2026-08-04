// ============================================================
//  Tales Hero Indonesia — Ganti Nickname
//  POST /auth/change-nickname
//
//  Body JSON: { nickname }
//
//  Biaya (harus cukup semua):
//    TR    50.000
//    Cash  15.000
//    MAU   20.000
//
//  Cooldown: sekali setiap 14 hari
//  Syarat  : 5–10 karakter, huruf (A-Z a-z) & angka (0-9) saja
// ============================================================

import { query } from '../db.js';
import { getSessionUsername } from './session.js';

const PRICE_TR   = 50_000;
const PRICE_CASH = 15_000;
const PRICE_MAU  = 20_000;
const COOLDOWN_DAYS = 14;

// ── Daftar badwords ──────────────────────────────────────────
const BADWORDS = [
  'anjing','anjir','babi','bangsat','bajingan','brengsek','sialan','goblok',
  'tolol','idiot','bodoh','asu','kampret','memek','kontol','ngentot','jancok',
  'cok','tai','taik','pepek','titit','genjot','ngentod','pelacur','sundal',
  'lonte','bajing','setan','iblis','keparat','bejat','bokep','bugil',
  'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy','cock',
  'nigger','faggot','retard','whore','slut',
  // ── Kata-kata yang menyerupai staff / tim resmi ───────────────
  'staff','staf','admin','administrator','owner','developer','dev',
  'moderator','mod','gm','gamemaster','game master','gamemast',
  'operator','oper','manager','manajer','official','resmi',
  'support','helpdesk','helpdesk','cs','csrep',
  'superadmin','superadmin','sysadmin','sysop',
];

function containsBadword(str) {
  const lower = str.toLowerCase();
  return BADWORDS.some(w => lower.includes(w));
}

// ── Validasi nickname ────────────────────────────────────────
function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') return 'Nickname tidak boleh kosong.';
  if (nickname.length < 5)  return 'Nickname minimal 5 karakter.';
  if (nickname.length > 10) return 'Nickname maksimal 10 karakter.';
  if (/\s/.test(nickname))  return 'Nickname tidak boleh mengandung spasi.';
  if (!/^[a-zA-Z0-9]+$/.test(nickname))
    return 'Nickname hanya boleh mengandung huruf (A-Z, a-z) dan angka (0-9). Karakter spesial tidak diizinkan.';
  if (containsBadword(nickname)) return 'Nickname mengandung kata yang tidak diperbolehkan.';
  return null;
}

async function changeNickname(req, res) {
  try {
    const username = await getSessionUsername(req);
    if (!username)
      return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });

    const { nickname } = req.body ?? {};

    // ── 1. Validasi nickname ──────────────────────────────
    const nicknameError = validateNickname(nickname);
    if (nicknameError) return res.status(400).json({ message: nicknameError });

    const newNickname = nickname;

    // ── 2. Cek cooldown 14 hari ───────────────────────────
    const lastChange = await query(
      `SELECT changed_at FROM nickname_change_logs
       WHERE username = ? ORDER BY changed_at DESC LIMIT 1`,
      [username],
    );
    if (lastChange.length > 0) {
      const msElapsed = Date.now() - new Date(lastChange[0].changed_at).getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
      if (daysElapsed < COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(COOLDOWN_DAYS - daysElapsed);
        return res.status(400).json({
          message: `Kamu baru saja mengganti nickname. Tunggu ${daysLeft} hari lagi sebelum bisa ganti kembali.`,
          cooldownDaysLeft: daysLeft,
        });
      }
    }

    // ── 3. Ambil data user ────────────────────────────────
    const rows = await query(
      `SELECT g.fdCash, ig.fdGameMoney, i.fdUserNum, i.fdNickname,
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

    const { fdCash, fdGameMoney, fdUserNum, fdNickname, mauPoint } = rows[0];

    // ── 4. Cek semua saldo cukup ──────────────────────────
    const shortages = [];
    if (Number(fdGameMoney) < PRICE_TR)   shortages.push(`TR ${PRICE_TR.toLocaleString('id-ID')}`);
    if (Number(fdCash)      < PRICE_CASH) shortages.push(`Cash ${PRICE_CASH.toLocaleString('id-ID')}`);
    if (Number(mauPoint)    < PRICE_MAU)  shortages.push(`MAU ${PRICE_MAU.toLocaleString('id-ID')}`);
    if (shortages.length > 0)
      return res.status(400).json({
        message: `Saldo tidak cukup: ${shortages.join(', ')}.`,
      });

    // ── 5. Potong semua biaya ─────────────────────────────
    await query(
      `UPDATE userinfofrompublisher SET fdCash = fdCash - ? WHERE fdUserID = ?`,
      [PRICE_CASH, username],
    );
    await query(
      `UPDATE userinfogame ig
       JOIN userinfo i ON ig.fdUserNum = i.fdUserNum
       SET ig.fdGameMoney = ig.fdGameMoney - ?
       WHERE i.fdUID = ?`,
      [PRICE_TR, username],
    );
    await query(
      `UPDATE userinfopoint SET fdPoint = fdPoint - ?
       WHERE fdUserNum = ? AND fdRewardCondition = 1201`,
      [PRICE_MAU, fdUserNum],
    );

    // ── 6. Update nickname di game ────────────────────────
    await query(
      `UPDATE userinfo SET fdNickname = ? WHERE fdUID = ?`,
      [newNickname, username],
    );

    // ── 7. Catat log perubahan ────────────────────────────
    await query(
      `INSERT INTO nickname_change_logs (username, old_nickname, new_nickname)
       VALUES (?, ?, ?)`,
      [username, fdNickname ?? '', newNickname],
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
