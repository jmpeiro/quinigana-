CREATE DATABASE IF NOT EXISTS quinigana_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quinigana_db;

CREATE TABLE IF NOT EXISTS users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NULL,
    avatar_url      VARCHAR(500) NULL,
    google_id       VARCHAR(255) NULL UNIQUE,
    auth_provider   ENUM('local', 'google', 'both') DEFAULT 'local',
    email_verified  BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
