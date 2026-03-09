-- Migration 025: Challenge completion and expiration fields
-- Add expired_at timestamp for auto-expiration tracking
-- The completed_at column already exists from migration 016, so only add expired_at

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP NULL AFTER completed_at;

-- Update the status enum to include 'expired' as a valid status
ALTER TABLE challenges MODIFY COLUMN status
  ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'expired')
  NOT NULL DEFAULT 'pending';

-- Index for finding expired challenges efficiently
CREATE INDEX IF NOT EXISTS idx_challenges_pending_created ON challenges(status, created_at);
