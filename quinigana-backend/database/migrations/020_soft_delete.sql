-- Migration: Account deletion soft-delete columns
ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL;
ALTER TABLE users ADD COLUMN deletion_requested_at DATETIME NULL;
