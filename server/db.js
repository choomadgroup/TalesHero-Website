// ============================================================
//  Tales Hero Indonesia — MySQL Connection Pool
//  Uses the existing Tales Runner game database.
// ============================================================

import mysql from 'mysql2/promise';

// ── CONFIG — dibaca dari environment secrets ─────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT ?? 3306),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME ?? 'tr_game_db',
  charset:            'utf8mb4',
  connectionLimit:    10,
  waitForConnections: true,
});

pool.on('error', (err) => {
  console.error('[db] ❌ Koneksi MySQL error:', err.message);
});

/**
 * Ping koneksi MySQL — dipanggil dari Vite plugin saat server start.
 * @returns {Promise<void>}
 */
async function ping() {
  const conn = await pool.getConnection();
  conn.release();
}
// ────────────────────────────────────────────────────────────

/**
 * Jalankan query MySQL dengan Promise.
 * @param {string} sql   - Query SQL dengan placeholder `?`
 * @param {any[]}  params - Nilai untuk placeholder
 * @returns {Promise<any>}
 */
async function query(sql, params = []) {
  const [results] = await pool.query(sql, params);
  return results;
}

export { pool, query, ping };
