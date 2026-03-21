CREATE TABLE IF NOT EXISTS tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  status ENUM('registration', 'active', 'completed') DEFAULT 'registration',
  bracket_size INT NOT NULL DEFAULT 8,
  current_round INT DEFAULT 1,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tournaments_group (group_id)
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id INT NOT NULL,
  user_id INT NOT NULL,
  seed INT,
  eliminated_in_round INT,
  PRIMARY KEY (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  round INT NOT NULL,
  match_order INT NOT NULL,
  player1_id INT,
  player2_id INT,
  winner_id INT,
  player1_score INT,
  player2_score INT,
  jornada_id INT,
  status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
  INDEX idx_tournament_matches (tournament_id, round)
);
