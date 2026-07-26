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

/**
 * Buat tabel website supplemental jika belum ada.
 * Dipanggil sekali saat server start.
 */
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tales_hero_web_users (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      username       VARCHAR(50)  NOT NULL UNIQUE,
      email          VARCHAR(100) NOT NULL DEFAULT '',
      sec_question   VARCHAR(200) NOT NULL DEFAULT '',
      sec_answer_hash CHAR(64)   NOT NULL DEFAULT '',
      created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      username   VARCHAR(50)  NOT NULL,
      token      CHAR(64)     NOT NULL UNIQUE,
      type       ENUM('password','security') NOT NULL,
      expires_at DATETIME     NOT NULL,
      used_at    DATETIME     DEFAULT NULL,
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token    (token),
      INDEX idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export { pool, query, ping, migrate };
