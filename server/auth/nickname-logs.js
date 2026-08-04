// ============================================================
//  Tales Hero Indonesia — Riwayat Perubahan Nickname
//  GET /auth/nickname-logs
// ============================================================

import { query } from '../db.js';
import { getSessionUsername } from './session.js';

async function nicknameLogs(req, res) {
  try {
    const username = await getSessionUsername(req);
    if (!username)
      return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });

    const logs = await query(
      `SELECT old_nickname, new_nickname, changed_at
       FROM nickname_change_logs
       WHERE username = ?
       ORDER BY changed_at DESC
       LIMIT 20`,
      [username],
    );

    // Cooldown info
    const lastChanged = logs[0]?.changed_at ?? null;
    let cooldownDaysLeft = 0;
    if (lastChanged) {
      const msElapsed = Date.now() - new Date(lastChanged).getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
      cooldownDaysLeft = daysElapsed < 14 ? Math.ceil(14 - daysElapsed) : 0;
    }

    return res.status(200).json({
      logs,
      totalChanges: logs.length,
      cooldownDaysLeft,
    });

  } catch (err) {
    console.error('[nickname-logs] error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

export default nicknameLogs;
