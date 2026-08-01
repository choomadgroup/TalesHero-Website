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
            COALESCE(uip.TotalPoint, 0) AS mauTotal,
            w.email, w.sec_question AS secQuestion
     FROM userinfofrompublisher g
     LEFT JOIN userinfo i ON i.fdUID = g.fdUserID
     LEFT JOIN userinfogame ig ON ig.fdUserNum = i.fdUserNum
     LEFT JOIN essenavataritemcpkref cpk ON cpk.fdItemNum = ig.fdAvatarCharacterSettingNum
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

  const fdChar = user.fdChar ?? null;
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