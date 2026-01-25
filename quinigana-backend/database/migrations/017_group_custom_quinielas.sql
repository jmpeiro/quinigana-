-- Migration 017: Support for independent group quinielas
-- Each group can create their own quiniela with custom matches

-- Group quinielas (independent from global jornadas)
CREATE TABLE IF NOT EXISTS `group_quinielas` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `deadline` DATETIME NOT NULL,
  `status` ENUM('open', 'closed', 'finished') NOT NULL DEFAULT 'open',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_group_quinielas_group` (`group_id`),
  INDEX `idx_group_quinielas_status` (`status`),
  INDEX `idx_group_quinielas_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matches for group quinielas (independent from global matches)
CREATE TABLE IF NOT EXISTS `group_quiniela_matches` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `quiniela_id` INT UNSIGNED NOT NULL,
  `match_number` TINYINT UNSIGNED NOT NULL,
  `home_team` VARCHAR(100) NOT NULL,
  `away_team` VARCHAR(100) NOT NULL,
  `match_date` DATETIME NULL,
  `home_score` TINYINT UNSIGNED NULL,
  `away_score` TINYINT UNSIGNED NULL,
  `result_1x2` CHAR(1) NULL,
  FOREIGN KEY (`quiniela_id`) REFERENCES `group_quinielas`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_quiniela_match` (`quiniela_id`, `match_number`),
  INDEX `idx_quiniela_matches_quiniela` (`quiniela_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User predictions for group quinielas
CREATE TABLE IF NOT EXISTS `group_quiniela_predictions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `quiniela_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `match_id` INT UNSIGNED NOT NULL,
  `prediction_1x2` CHAR(1) NOT NULL,
  `home_score_prediction` TINYINT UNSIGNED NULL,
  `away_score_prediction` TINYINT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`quiniela_id`) REFERENCES `group_quinielas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`match_id`) REFERENCES `group_quiniela_matches`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_match_prediction` (`user_id`, `match_id`),
  INDEX `idx_predictions_quiniela` (`quiniela_id`),
  INDEX `idx_predictions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Results/scores per user per quiniela
CREATE TABLE IF NOT EXISTS `group_quiniela_scores` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `quiniela_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `correct_1x2` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `correct_pleno` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `total_points` DECIMAL(5,1) NOT NULL DEFAULT 0,
  `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quiniela_id`) REFERENCES `group_quinielas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_quiniela_user_score` (`quiniela_id`, `user_id`),
  INDEX `idx_scores_points` (`total_points` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
