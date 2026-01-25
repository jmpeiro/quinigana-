-- Gamification: Badges/Achievements and Experience Levels

CREATE TABLE badge_definitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category ENUM('prediction','streak','volume','social','ranking') NOT NULL,
  tier ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  xp_reward INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badge_definitions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_badge (user_id, badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_xp (
  user_id INT UNSIGNED PRIMARY KEY,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE xp_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  xp_amount INT NOT NULL,
  source VARCHAR(50) NOT NULL,
  reference_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_xp_log (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed badge definitions
INSERT INTO badge_definitions (code, name, description, icon, category, tier, xp_reward, sort_order) VALUES
('first_pleno', 'Primer Pleno', 'Acertar tu primer resultado exacto', 'auto_awesome', 'prediction', 'gold', 50, 1),
('pleno_x5', '5 Plenos', 'Acertar 5 resultados exactos', 'auto_awesome', 'prediction', 'platinum', 100, 2),
('streak_3', 'Racha de 3', '3 jornadas consecutivas con 50%+ acierto', 'local_fire_department', 'streak', 'bronze', 20, 10),
('streak_5', 'Racha de 5', '5 jornadas consecutivas con 50%+ acierto', 'local_fire_department', 'streak', 'silver', 50, 11),
('streak_10', 'Racha de 10', '10 jornadas consecutivas con 50%+ acierto', 'local_fire_department', 'streak', 'gold', 100, 12),
('predictions_10', 'Novato', 'Completar 10 predicciones', 'sports_soccer', 'volume', 'bronze', 10, 20),
('predictions_50', 'Experimentado', 'Completar 50 predicciones', 'sports_soccer', 'volume', 'silver', 30, 21),
('predictions_100', 'Veterano', 'Completar 100 predicciones', 'sports_soccer', 'volume', 'gold', 60, 22),
('points_50', '50 Puntos', 'Alcanzar 50 puntos totales', 'emoji_events', 'prediction', 'bronze', 15, 30),
('points_100', '100 Puntos', 'Alcanzar 100 puntos totales', 'emoji_events', 'prediction', 'silver', 30, 31),
('points_500', '500 Puntos', 'Alcanzar 500 puntos totales', 'emoji_events', 'prediction', 'gold', 75, 32),
('points_1000', 'Leyenda', 'Alcanzar 1000 puntos totales', 'emoji_events', 'prediction', 'platinum', 150, 33),
('group_champion', 'Campeon', 'Terminar #1 en el ranking de un grupo', 'military_tech', 'ranking', 'gold', 80, 40),
('first_proposal', 'Creador', 'Crear tu primera propuesta', 'edit_note', 'social', 'bronze', 10, 50),
('first_vote', 'Democrata', 'Emitir tu primer voto', 'how_to_vote', 'social', 'bronze', 10, 51),
('proposals_10', 'Proponedor', 'Crear 10 propuestas', 'edit_note', 'social', 'silver', 30, 52);
