USE quinigana_db;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    used_at         TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
