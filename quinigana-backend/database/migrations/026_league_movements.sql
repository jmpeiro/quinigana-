CREATE TABLE IF NOT EXISTS league_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  from_division_id INT NOT NULL,
  to_division_id INT NOT NULL,
  season_id INT NOT NULL,
  type ENUM('promotion', 'relegation') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_league_movements_season (season_id),
  INDEX idx_league_movements_user (user_id)
);
