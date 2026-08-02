import { query } from './db.js';
import { isMaintenanceMode } from './state.js';

export default async function stats(req, res) {
  try {
    const [accountRows, onlineRows] = await Promise.all([
      // userinfofrompublisher = akun game sesungguhnya (bukan hanya web registrasi)
      query('SELECT COUNT(*) AS total FROM userinfofrompublisher'),
      query('SELECT COUNT(*) AS total FROM userinfologin WHERE fdServerNum > 0'),
    ]);
    res.status(200).json({
      accounts: Number(accountRows[0].total),
      online:   Number(onlineRows[0].total),
    });
  } catch {
    res.status(500).json({ accounts: null, online: null });
  }
}

/** GET /api/stats/server-status — status server: online / offline / maintenance */
export async function serverStatus(req, res) {
  try {
    if (isMaintenanceMode()) {
      return res.status(200).json({ status: 'maintenance', onlineCount: 0 });
    }
    const rows = await query('SELECT COUNT(*) AS total FROM userinfologin WHERE fdServerNum > 0');
    const onlineCount = Number(rows[0].total);
    return res.status(200).json({
      status: onlineCount > 0 ? 'online' : 'offline',
      onlineCount,
    });
  } catch {
    return res.status(200).json({ status: 'offline', onlineCount: 0 });
  }
}

/** GET /api/stats/online-players — daftar nickname yang sedang online */
export async function onlinePlayers(req, res) {
  try {
    const rows = await query(
      `SELECT ui.fdNickname
       FROM userinfologin ul
       JOIN userinfo ui ON ui.fdUserNum = ul.fdUserNum
       WHERE ul.fdServerNum > 0
       ORDER BY ui.fdNickname ASC
       LIMIT 100`,
    );
    res.status(200).json(rows.map(r => r.fdNickname));
  } catch {
    res.status(500).json([]);
  }
}
