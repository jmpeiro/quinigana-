-- Migration 004: Create groups tables
-- Groups, members, and invitations

CREATE TABLE IF NOT EXISTS `groups` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `avatar_url` VARCHAR(500),
  `created_by` INT UNSIGNED NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_group_member` (`group_id`, `user_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_invitations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NOT NULL,
  `invited_by` INT UNSIGNED NOT NULL,
  `invited_user_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `responded_at` TIMESTAMP NULL,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invited_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster invitation lookups
CREATE INDEX `idx_invitations_user_status` ON `group_invitations` (`invited_user_id`, `status`);
CREATE INDEX `idx_invitations_group` ON `group_invitations` (`group_id`, `status`);
