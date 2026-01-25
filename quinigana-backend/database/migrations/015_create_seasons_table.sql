-- Migration 015: Create seasons table and link jornadas

CREATE TABLE IF NOT EXISTS `seasons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `display_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_seasons_current` (`is_current`),
  INDEX `idx_seasons_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add season_id foreign key to jornadas (optional, will be populated later)
ALTER TABLE `jornadas`
  ADD COLUMN `season_id` INT UNSIGNED NULL AFTER `season`,
  ADD CONSTRAINT `fk_jornadas_season` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE SET NULL;

-- Create index for season_id lookups
CREATE INDEX `idx_jornadas_season_id` ON `jornadas` (`season_id`);

-- Insert existing seasons from jornadas table
INSERT IGNORE INTO `seasons` (`name`, `display_name`, `start_date`, `end_date`, `is_current`)
SELECT DISTINCT
  j.season,
  CONCAT('Temporada ', j.season),
  COALESCE(MIN(DATE(j.deadline)), CURDATE()),
  COALESCE(MAX(DATE(j.deadline)), CURDATE()),
  FALSE
FROM `jornadas` j
WHERE j.season IS NOT NULL AND j.season != ''
GROUP BY j.season;

-- Update jornadas with season_id based on season name
UPDATE `jornadas` j
INNER JOIN `seasons` s ON j.season = s.name
SET j.season_id = s.id;

-- Set most recent season as current
UPDATE `seasons` s
INNER JOIN (
  SELECT id FROM `seasons` ORDER BY end_date DESC LIMIT 1
) latest ON s.id = latest.id
SET s.is_current = TRUE;
