-- Migration: Add missing performance indexes

-- Proposals indexes
CREATE INDEX idx_proposals_jornada_group ON proposals(jornada_id, group_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Scores indexes
CREATE INDEX idx_scores_user_jornada ON scores(user_id, jornada_id);
CREATE INDEX idx_scores_jornada ON scores(jornada_id);

-- Challenges indexes
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_users ON challenges(challenger_id, challenged_id);

-- Notifications index
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Group members indexes
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

-- League standings index
CREATE INDEX idx_league_standings_season ON league_standings(season_id, division);

-- Jornadas index
CREATE INDEX idx_jornadas_season_status ON jornadas(season_id, status);
