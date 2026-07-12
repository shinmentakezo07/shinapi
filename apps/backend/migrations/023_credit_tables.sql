-- Add credit_transactions table (was referenced by repository/seed code but
-- never created by a prior migration) and the updated_at column on
-- user_credits (referenced by CreditsRepo queries). Both are required for the
-- credit purchase / balance / transaction flow to work in production.

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    related_log_id TEXT,
    stripe_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);

ALTER TABLE user_credits
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
