-- Migration 006: Create proposals and voting tables

CREATE TABLE IF NOT EXISTS `quiniela_proposals` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NOT NULL,
  `jornada_id` INT UNSIGNED NOT NULL,
  `proposed_by` INT UNSIGNED NOT NULL,
  `status` ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  `title` VARCHAR(200),
  `votes_for` INT NOT NULL DEFAULT 0,
  `votes_against` INT NOT NULL DEFAULT 0,
  `total_members_at_creation` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_group_jornada_user` (`group_id`, `jornada_id`, `proposed_by`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jornada_id`) REFERENCES `jornadas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`proposed_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proposal_predictions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `proposal_id` INT UNSIGNED NOT NULL,
  `match_id` INT UNSIGNED NOT NULL,
  `prediction_1x2` ENUM('1', 'X', '2') NOT NULL,
  `home_score_prediction` INT NULL,
  `away_score_prediction` INT NULL,
  UNIQUE KEY `unique_proposal_match` (`proposal_id`, `match_id`),
  FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proposal_votes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `proposal_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `vote` ENUM('approve', 'reject') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_proposal_vote` (`proposal_id`, `user_id`),
  FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for proposal lookups
CREATE INDEX `idx_proposals_group_jornada` ON `quiniela_proposals` (`group_id`, `jornada_id`, `status`);
CREATE INDEX `idx_proposals_status` ON `quiniela_proposals` (`status`);
