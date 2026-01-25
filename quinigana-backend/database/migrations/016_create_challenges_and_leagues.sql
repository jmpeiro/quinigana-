-- Migration 016: Create 1vs1 challenges and league divisions system
-- Retos entre usuarios y sistema de ligas con ascenso/descenso

-- =====================================================
-- SISTEMA DE RETOS 1VS1
-- =====================================================

CREATE TABLE IF NOT EXISTS `challenges` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `challenger_id` INT UNSIGNED NOT NULL,
  `challenged_id` INT UNSIGNED NOT NULL,
  `jornada_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `wager_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `winner_id` INT UNSIGNED NULL,
  `challenger_score` INT NULL,
  `challenged_score` INT NULL,
  `message` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `responded_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (`challenger_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`challenged_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jornada_id`) REFERENCES `jornadas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_challenge` (`challenger_id`, `challenged_id`, `jornada_id`),
  INDEX `idx_challenges_status` (`status`),
  INDEX `idx_challenges_jornada` (`jornada_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de enfrentamientos (estadisticas acumuladas)
CREATE TABLE IF NOT EXISTS `challenge_stats` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `opponent_id` INT UNSIGNED NOT NULL,
  `total_challenges` INT UNSIGNED NOT NULL DEFAULT 0,
  `wins` INT UNSIGNED NOT NULL DEFAULT 0,
  `losses` INT UNSIGNED NOT NULL DEFAULT 0,
  `draws` INT UNSIGNED NOT NULL DEFAULT 0,
  `points_won` INT NOT NULL DEFAULT 0,
  `points_lost` INT NOT NULL DEFAULT 0,
  `last_challenge_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`opponent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_rivalry` (`user_id`, `opponent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Puntos de reputacion del usuario (para apostar en retos)
ALTER TABLE `users` ADD COLUMN `reputation_points` INT UNSIGNED NOT NULL DEFAULT 100 AFTER `is_admin`;

-- =====================================================
-- SISTEMA DE LIGAS Y DIVISIONES
-- =====================================================

-- Definicion de divisiones
CREATE TABLE IF NOT EXISTS `league_divisions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `tier` INT UNSIGNED NOT NULL,
  `icon` VARCHAR(50) NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  `min_players` INT UNSIGNED NOT NULL DEFAULT 1,
  `max_players` INT UNSIGNED NULL,
  `promotion_slots` INT UNSIGNED NOT NULL DEFAULT 3,
  `relegation_slots` INT UNSIGNED NOT NULL DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Temporadas de liga
CREATE TABLE IF NOT EXISTS `league_seasons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `season_id` INT UNSIGNED NOT NULL,
  `start_jornada_id` INT UNSIGNED NULL,
  `end_jornada_id` INT UNSIGNED NULL,
  `status` ENUM('upcoming', 'active', 'completed') NOT NULL DEFAULT 'upcoming',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`start_jornada_id`) REFERENCES `jornadas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`end_jornada_id`) REFERENCES `jornadas`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios en ligas (clasificacion actual)
CREATE TABLE IF NOT EXISTS `league_standings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `league_season_id` INT UNSIGNED NOT NULL,
  `division_id` INT UNSIGNED NOT NULL,
  `points` INT UNSIGNED NOT NULL DEFAULT 0,
  `jornadas_played` INT UNSIGNED NOT NULL DEFAULT 0,
  `correct_1x2` INT UNSIGNED NOT NULL DEFAULT 0,
  `correct_pleno` INT UNSIGNED NOT NULL DEFAULT 0,
  `position` INT UNSIGNED NULL,
  `previous_position` INT UNSIGNED NULL,
  `promotion_status` ENUM('none', 'promoted', 'relegated') NOT NULL DEFAULT 'none',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`division_id`) REFERENCES `league_divisions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_league_season` (`user_id`, `league_season_id`),
  INDEX `idx_standings_division` (`division_id`, `points` DESC),
  INDEX `idx_standings_season` (`league_season_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de movimientos entre divisiones
CREATE TABLE IF NOT EXISTS `league_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `league_season_id` INT UNSIGNED NOT NULL,
  `from_division_id` INT UNSIGNED NULL,
  `to_division_id` INT UNSIGNED NOT NULL,
  `final_position` INT UNSIGNED NULL,
  `final_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `movement_type` ENUM('initial', 'promoted', 'relegated', 'maintained') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_division_id`) REFERENCES `league_divisions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_division_id`) REFERENCES `league_divisions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA: Divisiones iniciales
-- =====================================================

INSERT INTO `league_divisions` (`name`, `tier`, `icon`, `color`, `promotion_slots`, `relegation_slots`) VALUES
('Division Leyenda', 1, 'diamond', '#9333ea', 0, 3),
('Division Oro', 2, 'emoji_events', '#eab308', 3, 3),
('Division Plata', 3, 'workspace_premium', '#94a3b8', 3, 3),
('Division Bronce', 4, 'military_tech', '#b45309', 3, 0);

-- =====================================================
-- BADGES para retos y ligas
-- =====================================================

INSERT INTO `badge_definitions` (`code`, `name`, `description`, `icon`, `category`, `tier`, `xp_reward`, `sort_order`) VALUES
('first_challenge', 'Retador', 'Completar tu primer reto 1vs1', 'sports_kabaddi', 'social', 'bronze', 15, 60),
('challenge_wins_5', 'Gladiador', 'Ganar 5 retos 1vs1', 'sports_kabaddi', 'social', 'silver', 40, 61),
('challenge_wins_20', 'Campeon de Retos', 'Ganar 20 retos 1vs1', 'sports_kabaddi', 'social', 'gold', 80, 62),
('undefeated_5', 'Invicto', 'Ganar 5 retos consecutivos', 'shield', 'streak', 'gold', 60, 63),
('division_promoted', 'Ascendido', 'Ascender de division', 'trending_up', 'ranking', 'silver', 50, 70),
('division_oro', 'Elite Dorada', 'Alcanzar Division Oro', 'emoji_events', 'ranking', 'gold', 75, 71),
('division_leyenda', 'Leyenda', 'Alcanzar Division Leyenda', 'diamond', 'ranking', 'platinum', 150, 72);
