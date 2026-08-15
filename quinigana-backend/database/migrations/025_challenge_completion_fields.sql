-- Migration 025: Challenge completion and expiration fields
-- Add expired_at timestamp for auto-expiration tracking
-- The completed_at column already exists from migration 016, so only add expired_at
--
-- NOTE: MySQL (unlike MariaDB) has no ADD COLUMN IF NOT EXISTS / CREATE INDEX
-- IF NOT EXISTS, so the guards below are done with information_schema lookups.

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'challenges' AND COLUMN_NAME = 'expired_at');
SET @sql := IF(@col = 0,
  'ALTER TABLE challenges ADD COLUMN expired_at TIMESTAMP NULL AFTER completed_at',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Update the status enum to include 'expired' as a valid status
ALTER TABLE challenges MODIFY COLUMN status
  ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'expired')
  NOT NULL DEFAULT 'pending';

-- Index for finding expired challenges efficiently
SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'challenges'
               AND INDEX_NAME = 'idx_challenges_pending_created');
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_challenges_pending_created ON challenges(status, created_at)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
