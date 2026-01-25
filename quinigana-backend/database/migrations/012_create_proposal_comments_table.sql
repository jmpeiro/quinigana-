CREATE TABLE IF NOT EXISTS `proposal_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `proposal_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_comments_proposal` ON `proposal_comments` (`proposal_id`, `created_at`);
