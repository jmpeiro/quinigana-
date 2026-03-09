-- Migration: Add email verification columns to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN email_verification_expires DATETIME NULL;
