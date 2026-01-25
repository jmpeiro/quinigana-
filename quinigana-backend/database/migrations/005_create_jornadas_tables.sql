-- Migration 005: Create jornadas and matches tables

CREATE TABLE IF NOT EXISTS `jornadas` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `season` VARCHAR(20) NOT NULL,
  `jornada_number` INT NOT NULL,
  `status` ENUM('open', 'closed', 'finished') NOT NULL DEFAULT 'open',
  `deadline` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_season_jornada` (`season`, `jornada_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matches` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `jornada_id` INT UNSIGNED NOT NULL,
  `match_number` INT NOT NULL,
  `home_team` VARCHAR(100) NOT NULL,
  `away_team` VARCHAR(100) NOT NULL,
  `match_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_jornada_match` (`jornada_id`, `match_number`),
  FOREIGN KEY (`jornada_id`) REFERENCES `jornadas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `match_results` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `match_id` INT UNSIGNED NOT NULL UNIQUE,
  `home_score` INT NOT NULL,
  `away_score` INT NOT NULL,
  `result_1x2` ENUM('1', 'X', '2') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for jornada status lookups
CREATE INDEX `idx_jornadas_status` ON `jornadas` (`status`);
