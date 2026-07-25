// ============================================================
//  Tales Hero Indonesia — MySQL Connection Pool
//  Isi nilai di bawah sesuai konfigurasi database kamu.
// ============================================================

const mysql = require('mysql');

// ── CONFIG — ganti sesuai server MySQL kamu ─────────────────
const pool = mysql.createPool({
  host:               'localhost',   // host / IP server MySQL
  port:               3306,          // port MySQL (default 3306)
  user:               'root',        // username database
  password:           '',            // password database
  database:           'taleshero',   // nama database (lihat schema.sql)
  charset:            'utf8mb4',
  connectionLimit:    10,
  waitForConnections: true,
});
// ────────────────────────────────────────────────────────────

/**
 * Jalankan query MySQL dengan Promise.
 * @param {string} sql   - Query SQL dengan placeholder `?`
 * @param {any[]}  params - Nilai untuk placeholder
 * @returns {Promise<any>}
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

module.exports = { pool, query };
