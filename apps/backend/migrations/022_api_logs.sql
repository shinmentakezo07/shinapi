-- Migration: api_logs table
-- Created: 2026-06-29
--
-- The api_logs table was queried by LogRepo and seeded by AutoSeed but was
-- never created by a migration. This caused /api/logs and /api/analytics to
-- return 500 "database error" on any Postgres-backed deployment.

CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost INT NOT NULL DEFAULT 0,
    latency INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_created ON api_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_model ON api_logs(model);
CREATE INDEX IF NOT EXISTS idx_api_logs_provider ON api_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
