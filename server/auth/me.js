import { query } from '../db.js';
import { getSessionUsername } from './session.js';

// fdChar → character name
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

// ── Level thresholds (cached after first load) ─────────────────────────────
let _levelThresholds = null;

async function getLevelThresholds() {
  if (_levelThresholds) return _levelThresholds;
  const rows = await query(
    'SELECT fdLevel, fdExp FROM essenlevelinfo WHERE fdLevelKind = 1 ORDER BY fdLevel ASC',
  );
  let cum = 0;
  _levelThresholds = rows.map(r => {
    const t = { level: r.fdLevel, cumStart: cum, increment: Number(r.fdExp) };
    cum += Number(r.fdExp);
    return t;
  });
  return _levelThresholds;
}

function computeLevel(fdExp, thresholds) {
  const exp = Number(fdExp ?? 0);
  let current = thresholds[0] ?? { level: 1, cumStart: 0, increment: 25 };
  for (const t of thresholds) {
    if (t.cumStart <= exp) current = t;
    else break;
  }
  const pct = current.increment > 0
    ? Math.min(100, ((exp - current.cumStart) / current.increment) * 100)
    : 100;
  return { level: current.level, expPct: Math.round(pct * 100) / 100 };
}

// ── Main query ─────────────────────────────────────────────────────────────
async function findUser(username) {
  const [thresholds, rows] = await Promise.all([
    getLevelThresholds(),
    query(
      `SELECT g.fdUserID, g.fdGameID, g.fdCash,
              i.fdNickname, i.fdUserNum,
              ig.fdGameMoney, ig.fdExp AS igExp,
              ig.fdAvatarCharacterSettingNum,
              cpk.fdChar,
              (
                -- Pick the base character item with the highest XP — that's the main char
                SELECT ad.fdCharacter
                FROM tblavataruser au
                JOIN tblavataritemdesc ad ON ad.fdItemNum = au.fdItemDescNum
                WHERE au.fdUserNum = i.fdUserNum
                  AND au.fdUsing = 1
                  AND ad.fdType = 1
                  AND ad.fdPosition = 0
                  AND ad.fdCharacter > 0
                ORDER BY au.fdExp DESC
                LIMIT 1
              ) AS fdCharFromInv,
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
         SELECT fdUserNum, SUM(fdPoint) AS TotalPoint
         FROM userinfopoint GROUP BY fdUserNum
       ) uip ON uip.fdUserNum = i.fdUserNum
       LEFT JOIN tales_hero_web_users w ON w.username = g.fdUserID
       WHERE g.fdUserID = ?
       LIMIT 1`,
      [username],
    ),
  ]);

  const user = rows[0];
  if (!user) return null;

  // Inventory (highest-XP base char) wins; cpkref is last resort
  const fdChar = (user.fdCharFromInv && user.fdCharFromInv > 0)
    ? user.fdCharFromInv
    : (user.fdChar && user.fdChar > 0)
      ? user.fdChar
      : null;
  const character = fdChar != null ? (CHAR_NAME_MAP[fdChar] ?? null) : null;

  const { level, expPct } = computeLevel(user.igExp, thresholds);

  return {
    username:    user.fdUserID,
    nickname:    user.fdNickname ?? '',
    gameId:      user.fdGameID,
    cash:        user.fdCash ?? 0,
    mau:         user.mauTotal ?? 0,
    tr:          user.fdGameMoney ?? 0,
    email:       user.email ?? '',
    secQuestion: user.secQuestion ?? '',
    character,
    exp:         Number(user.igExp ?? 0),
    level,
    expPct,
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
