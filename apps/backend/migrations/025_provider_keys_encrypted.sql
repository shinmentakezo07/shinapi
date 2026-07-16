-- Persist provider API keys encrypted-at-rest so admin-added providers
-- can be re-registered with working credentials after process restart.
-- Hash/prefix/last-four remain for display and integrity checks.
ALTER TABLE provider_keys
  ADD COLUMN IF NOT EXISTS encrypted_key TEXT NOT NULL DEFAULT '';
