-- Migration: Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_audit_admin (admin_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
);
