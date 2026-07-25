// ============================================================
//  Tales Hero Indonesia — MySQL Connection Pool
//  Isi nilai di bawah sesuai konfigurasi database kamu.
// ============================================================

import mysql from 'mysql2/promise';

// ── CONFIG — dibaca dari environment secrets ─────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     ?? 'localhost',
  port:               Number(process.env.DB_PORT ?? 3306),
  user:               process.env.DB_USER     ?? 'root',
  password:           process.env.DB_PASSWORD ?? '',
  database:           process.env.DB_NAME     ?? 'taleshero',
  charset:            'utf8mb4',
  connectionLimit:    10,
  waitForConnections: true,
});

// ── Log status koneksi saat pool pertama kali digunakan ─────
pool.on('connection', (connection) => {
  console.log(`Terhubung ke MySQL — thread #${connection.threadId}`);
});

pool.on('error', (err) => {
  console.error('[db] ❌ Koneksi MySQL error:', err.message);
});
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

export { pool, query };
