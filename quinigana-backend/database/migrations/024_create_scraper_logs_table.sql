-- Migration 024: Scraper source tracking
CREATE TABLE IF NOT EXISTS scraper_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jornada_id INT NOT NULL,
  source ENUM('resultados-futbol','football-data-api','manual') NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT NULL,
  matches_updated INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jornada_id) REFERENCES jornadas(id)
);

CREATE INDEX idx_scraper_logs_jornada ON scraper_logs(jornada_id);
