import { query } from './db.js';

export default async function stats(req, res) {
  try {
    const rows = await query('SELECT COUNT(*) AS total FROM tales_hero_web_users');
    res.status(200).json({ accounts: Number(rows[0].total) });
  } catch {
    res.status(500).json({ accounts: null });
  }
}
