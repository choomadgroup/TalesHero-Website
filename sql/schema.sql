-- ============================================================
--  Tales Hero Indonesia — Database Schema
--  Engine: MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

CREATE DATABASE IF NOT EXISTS taleshero
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taleshero;

-- ── Tabel Pengguna ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username      VARCHAR(24)     NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(60)     NOT NULL,          -- bcrypt hash
  sec_question  VARCHAR(255)    NOT NULL,           -- pertanyaan keamanan
  sec_answer    VARCHAR(60)     NOT NULL,           -- bcrypt hash jawaban
  is_verified   TINYINT(1)      NOT NULL DEFAULT 0, -- 0=belum, 1=sudah verifikasi email
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
