CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('new_jornada','proposal_submitted','vote_needed','results_published','invitation_received') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read, created_at DESC)
);
