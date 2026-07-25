-- ============================================================
--  Tales Hero Indonesia — Game Account Schema
--  Engine: MySQL 5.7+ / MariaDB 10.3+
--
--  The imported game database already contains this table.
--  The website writes new registrations here so the game can
--  use the same account. The game server creates rows in
--  userinfo/userinfogame/userinfologin on first game login.
-- ============================================================

CREATE DATABASE IF NOT EXISTS tr_game_db
  CHARACTER SET tis620
  COLLATE tis620_thai_ci;

USE tr_game_db;

CREATE TABLE IF NOT EXISTS userinfofrompublisher (
  fdUserID   VARCHAR(50) NOT NULL,
  fdGameID   VARCHAR(50) DEFAULT NULL,
  fdPassword VARCHAR(50) NOT NULL, -- lowercase MD5 hex, required by game server
  fdCash     INT DEFAULT 100000,
  PRIMARY KEY (fdUserID),
  UNIQUE KEY fdUserID (fdUserID)
) ENGINE=InnoDB DEFAULT CHARSET=tis620;
