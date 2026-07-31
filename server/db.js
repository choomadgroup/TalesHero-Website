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
  console.error('[Database] ❌ Koneksi MySQL error:', err.message);
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tales_hero_sessions (
      token_hash CHAR(64) NOT NULL PRIMARY KEY,
      username   VARCHAR(50) NOT NULL,
      expires_at DATETIME   NOT NULL,
      created_at DATETIME   DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session_username (username),
      INDEX idx_session_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Email recovery addresses are one-time identifiers for website accounts.
  // Keep startup alive for legacy databases that already contain duplicates;
  // registration still rejects duplicates transactionally.
  try {
    await pool.query(`
      ALTER TABLE tales_hero_web_users
      ADD UNIQUE KEY uq_tales_hero_web_users_email (email)
    `);
  } catch (error) {
    if (!['ER_DUP_KEYNAME', 'ER_DUP_ENTRY'].includes(error?.code)) throw error;
  }

  // Tambah kolom jawaban plain-text agar bisa dikirim via email pemulihan.
  // Hash tetap dipakai untuk verifikasi di change-password.
  try {
    await pool.query(`
      ALTER TABLE tales_hero_web_users
      ADD COLUMN sec_answer VARCHAR(200) NOT NULL DEFAULT '' AFTER sec_answer_hash
    `);
  } catch (error) {
    if (error?.code !== 'ER_DUP_FIELDNAME') throw error;
  }

  // ── Redeem codes ─────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS redeem_codes (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      code          VARCHAR(50)  NOT NULL UNIQUE,
      reward_type   ENUM('cash','tr') NOT NULL DEFAULT 'cash',
      reward_amount INT          NOT NULL DEFAULT 0,
      max_uses      INT          NOT NULL DEFAULT 1,
      used_count    INT          NOT NULL DEFAULT 0,
      expires_at    DATETIME     DEFAULT NULL,
      created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_redeem_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS redeem_code_uses (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      code       VARCHAR(50) NOT NULL,
      username   VARCHAR(50) NOT NULL,
      used_at    DATETIME    DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_redeem_code_user (code, username),
      INDEX idx_redeem_code_uses (code, username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export { pool, query, ping, migrate };
