-- Migration 023: Performance indexes for frequently queried columns
-- Covers: predictions, proposals, rankings, jornadas, challenges, user_badges, notifications

-- Predictions: user+jornada lookups
CREATE INDEX IF NOT EXISTS idx_predictions_user_jornada ON proposal_predictions(proposal_id);

-- Proposals: group+jornada filtering
CREATE INDEX IF NOT EXISTS idx_proposals_group_jornada ON quiniela_proposals(group_id, jornada_id);

-- Rankings: score-based ordering for leaderboards
-- group_scores already has group_id, add composite for ordering
CREATE INDEX IF NOT EXISTS idx_group_scores_total_desc ON group_scores(group_id, total_points DESC);

-- Jornadas: status filtering
CREATE INDEX IF NOT EXISTS idx_jornadas_status ON jornadas(status);

-- Challenges: status + user lookups
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id, status);

-- User badges: user lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- Notifications: user + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_v2 ON notifications(user_id, is_read, created_at DESC);
