-- Migration 018: Action metadata for notifications + activity/query indexes

ALTER TABLE notifications
  ADD COLUMN action_type ENUM('open_proposal', 'open_jornada', 'open_invite', 'open_challenge') NULL AFTER link,
  ADD COLUMN action_group_id INT UNSIGNED NULL AFTER action_type,
  ADD COLUMN action_jornada_id INT UNSIGNED NULL AFTER action_group_id,
  ADD COLUMN action_proposal_id INT UNSIGNED NULL AFTER action_jornada_id,
  ADD COLUMN action_challenge_id INT UNSIGNED NULL AFTER action_proposal_id;

CREATE INDEX idx_notifications_user_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_type_created_at ON notifications (user_id, type, created_at DESC);

CREATE INDEX idx_proposals_group_created_at ON quiniela_proposals (group_id, created_at DESC);
CREATE INDEX idx_proposal_votes_proposal_created_at ON proposal_votes (proposal_id, created_at DESC);
CREATE INDEX idx_group_members_group_joined_at ON group_members (group_id, joined_at DESC);
CREATE INDEX idx_group_scores_group_created_at ON group_scores (group_id, created_at DESC);
CREATE INDEX idx_user_badges_user_earned_at ON user_badges (user_id, earned_at DESC);
CREATE INDEX idx_challenges_completed_at ON challenges (status, completed_at DESC);
