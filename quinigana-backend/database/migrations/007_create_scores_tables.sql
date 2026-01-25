-- Migration 007: Create scoring and results tables

CREATE TABLE IF NOT EXISTS `quiniela_results` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `proposal_id` INT UNSIGNED NOT NULL,
  `match_id` INT UNSIGNED NOT NULL,
  `points_1x2` INT NOT NULL DEFAULT 0,
  `points_pleno` INT NOT NULL DEFAULT 0,
  `is_correct_1x2` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_correct_pleno` BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY `unique_result_proposal_match` (`proposal_id`, `match_id`),
  FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_scores` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NOT NULL,
  `jornada_id` INT UNSIGNED NOT NULL,
  `proposal_id` INT UNSIGNED NULL,
  `total_points` INT NOT NULL DEFAULT 0,
  `correct_1x2` INT NOT NULL DEFAULT 0,
  `correct_pleno` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_group_jornada_score` (`group_id`, `jornada_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jornada_id`) REFERENCES `jornadas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for ranking queries
CREATE INDEX `idx_group_scores_group` ON `group_scores` (`group_id`, `total_points` DESC);
