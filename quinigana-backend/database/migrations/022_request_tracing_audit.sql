-- Migration 022: Request tracing and audit improvements
-- Note: The audit log table is named admin_audit_log (from migration 019)
ALTER TABLE admin_audit_log ADD COLUMN request_id VARCHAR(36) NULL;
CREATE INDEX idx_audit_request_id ON admin_audit_log(request_id);
