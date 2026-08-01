import { query } from '../db.js';
import { getSessionUsername } from './session.js';

// fdChar → character name mapping (built from essenavataritemcpkref + Characters.ts ingameId)
const CHAR_NAME_MAP = {
  1:  'Jaka',
  2:  'Mingming',
  3:  'Tifanny',
  4:  'BigBo',
  5:  'DnD',
  6:  'Narcius',
  7:  'Maki',
  8:  'Rough',
  9:  'Dewi',
  10: 'Kai',
  11: 'Rina',
  12: 'Rini',
  13: 'Abel',
  14: 'Haru',
  15: 'Vera',
  16: 'Wukong',
  17: 'Hidden Rough',
  18: 'Siho',
  19: 'Luci',
  20: 'Miho',
  22: 'R',
  23: 'Harang',
  24: 'LaLa',
  25: 'Elims',
  26: 'Cain',
  27: 'YeonOh',
  28: 'Bloody Vera',
};

async function findUser(username) {
  const rows = await query(
    `SELECT g.fdUserID, g.fdGameID, g.fdCash,
            i.fdNickname,
            ig.fdGameMoney,
            ig.fdAvatarCharacterSettingNum,
            cpk.fdChar,
            inv.fdCharFromInv,
            COALESCE(uip.TotalPoint, 0) AS mauTotal,
            w.email, w.sec_question AS secQuestion
     FROM userinfofrompublisher g
     LEFT JOIN userinfo i ON i.fdUID = g.fdUserID
     LEFT JOIN userinfogame ig ON ig.fdUserNum = i.fdUserNum
     LEFT JOIN (
       SELECT fdItemNum, MIN(fdChar) AS fdChar
       FROM essenavataritemcpkref
       WHERE fdChar > 0
       GROUP BY fdItemNum
     ) cpk ON cpk.fdItemNum = ig.fdAvatarCharacterSettingNum
     LEFT JOIN (
       -- Base character item (fdType=1, fdPosition=0) — reliable regardless of what
       -- fashion outfit the player is wearing on top
       SELECT au.fdUserNum, MIN(ad.fdCharacter) AS fdCharFromInv
       FROM tblavataruser au
       JOIN tblavataritemdesc ad ON ad.fdItemNum = au.fdItemDescNum
       WHERE au.fdUsing = 1
         AND ad.fdType = 1
         AND ad.fdPosition = 0
         AND ad.fdCharacter > 0
       GROUP BY au.fdUserNum
     ) inv ON inv.fdUserNum = i.fdUserNum
     LEFT JOIN (
       SELECT fdUserNum, SUM(fdPoint) AS TotalPoint
       FROM userinfopoint GROUP BY fdUserNum
     ) uip ON uip.fdUserNum = i.fdUserNum
     LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
     WHERE g.fdUserID = ?
     LIMIT 1`,
    [username],
  );

  const user = rows[0];
  if (!user) return null;

  // Prefer base character from inventory (fdType=1, fdPosition=0) — this is the actual
  // character the player IS, regardless of what fashion they're wearing on top.
  // cpk.fdChar (fdAvatarCharacterSettingNum) tracks the avatar fashion SET and can
  // belong to a different character, so it's only used as a last resort.
  const fdChar = (user.fdCharFromInv && user.fdCharFromInv > 0)
    ? user.fdCharFromInv
    : (user.fdChar && user.fdChar > 0)
      ? user.fdChar
      : null;
  const character = fdChar != null ? (CHAR_NAME_MAP[fdChar] ?? null) : null;

  return {
    username: user.fdUserID,
    nickname: user.fdNickname ?? '',
    gameId: user.fdGameID,
    cash: user.fdCash ?? 0,
    mau:  user.mauTotal ?? 0,
    tr: user.fdGameMoney ?? 0,
    email: user.email ?? '',
    secQuestion: user.secQuestion ?? '',
    character,
  };
}

async function me(req, res) {
  try {
    const username = await getSessionUsername(req);
    if (!username) return res.status(401).json({ message: 'Sesi login tidak valid.' });

    const user = await findUser(username);
    if (!user) return res.status(401).json({ message: 'Akun tidak ditemukan.' });
    return res.status(200).json({ user });
  } catch (err) {
    console.error('[me] error:', err);
    return res.status(500).json({ message: 'Gagal memuat sesi login.' });
  }
}

export { findUser };
export default me;