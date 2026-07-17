// File: apps/backend/internal/db/lite_schema.go
//
// Lite SQLite schema + seed definitions for the SQLite runtime path.
//
// Derived from apps/backend/migrations/*.sql (Postgres) translated to SQLite:
// UUID/TIMESTAMPTZ → TEXT, BOOLEAN → INTEGER 0/1, JSONB/TEXT[] → TEXT (JSON),
// BIGSERIAL → INTEGER AUTOINCREMENT, NOW() → strftime(...), gen_random_uuid()
// defaults removed (app generates IDs). Partitioned tables become plain tables.
//
// Keep in sync when migrations add tables/columns. Ensure*Column maps migrate
// existing on-disk yapapa.db files whose CREATE TABLE IF NOT EXISTS is a no-op.
package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"dra-platform/backend/internal/pkg/logger"
	"dra-platform/backend/internal/pkg/password"

	"github.com/google/uuid"
)

// usersLiteColumnAdditions migrates older lite users tables.
var usersLiteColumnAdditions = map[string]string{
	"status":               "TEXT NOT NULL DEFAULT 'active'",
	"rate_limit_tier_id":   "TEXT",
	"rate_limit_overrides": "TEXT DEFAULT '{}'",
	"last_login_ip":        "TEXT DEFAULT ''",
	"last_login_at":        "TEXT",
	"notes":                "TEXT DEFAULT ''",
	"tags":                 "TEXT DEFAULT '[]'",
	"suspended_by":         "TEXT",
	"suspension_reason":    "TEXT DEFAULT ''",
	"suspended_at":         "TEXT",
	"deleted_at":           "TEXT",
	"metadata":             "TEXT DEFAULT '{}'",
	"tier":                 "TEXT NOT NULL DEFAULT 'free'",
}

// apiKeysLiteColumnAdditions migrates older lite api_keys tables.
var apiKeysLiteColumnAdditions = map[string]string{
	"allowed_models":         "TEXT DEFAULT '[]'",
	"allowed_ips":            "TEXT DEFAULT '[]'",
	"max_tokens_per_request": "INTEGER",
	"daily_request_limit":    "INTEGER",
	"monthly_token_limit":    "INTEGER",
}

// userCreditsLiteColumnAdditions migrates older lite user_credits tables.
var userCreditsLiteColumnAdditions = map[string]string{
	"monthly_budget":  "INTEGER",
	"daily_budget":    "INTEGER",
	"daily_spent":     "INTEGER NOT NULL DEFAULT 0",
	"monthly_spent":   "INTEGER NOT NULL DEFAULT 0",
	"budget_reset_at": "TEXT",
	"updated_at":      "TEXT", // nullable on ALTER; CREATE TABLE uses strftime default
}

// modelRegistryLiteColumnAdditions migrates model_registry without 021 cols.
var modelRegistryLiteColumnAdditions = map[string]string{
	"model_group":     "TEXT DEFAULT ''",
	"fallback_models": "TEXT DEFAULT '[]'",
	"credential_name": "TEXT DEFAULT ''",
	"routing_weight":  "INTEGER NOT NULL DEFAULT 1",
	"is_wildcard":     "INTEGER NOT NULL DEFAULT 0",
}

// providerKeysLiteColumnAdditions migrates provider_keys for durable encrypted keys.
var providerKeysLiteColumnAdditions = map[string]string{
	"encrypted_key": "TEXT NOT NULL DEFAULT ''",
}

// LiteDDL is the full SQLite-dialect schema for the lite runtime.
var LiteDDL = []string{
	`CREATE TABLE IF NOT EXISTS users (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
email TEXT NOT NULL UNIQUE,
password TEXT,
role TEXT NOT NULL DEFAULT 'user',
created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
status TEXT NOT NULL DEFAULT 'active',
rate_limit_tier_id TEXT,
rate_limit_overrides TEXT DEFAULT '{}',
last_login_ip TEXT DEFAULT '',
last_login_at TEXT,
notes TEXT DEFAULT '',
tags TEXT DEFAULT '[]',
suspended_by TEXT,
suspension_reason TEXT DEFAULT '',
suspended_at TEXT,
deleted_at TEXT,
metadata TEXT DEFAULT '{}',
tier TEXT NOT NULL DEFAULT 'free'
)`,
	`CREATE TABLE IF NOT EXISTS api_keys (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
name TEXT NOT NULL,
key TEXT NOT NULL,
last_used TEXT,
created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
revoked_at TEXT,
allowed_models TEXT DEFAULT '[]',
allowed_ips TEXT DEFAULT '[]',
max_tokens_per_request INTEGER,
daily_request_limit INTEGER,
monthly_token_limit INTEGER
)`,
	`CREATE TABLE IF NOT EXISTS user_credits (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
balance INTEGER NOT NULL DEFAULT 0,
total_purchased INTEGER NOT NULL DEFAULT 0,
total_spent INTEGER NOT NULL DEFAULT 0,
monthly_budget INTEGER,
daily_budget INTEGER,
daily_spent INTEGER NOT NULL DEFAULT 0,
monthly_spent INTEGER NOT NULL DEFAULT 0,
budget_reset_at TEXT,
updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS conversations (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL DEFAULT 'New Conversation',
 model TEXT NOT NULL DEFAULT 'openai/gpt-4o',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS conversation_messages (
 id TEXT PRIMARY KEY ,
 conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 role TEXT NOT NULL,
 content TEXT NOT NULL,
 input_tokens INTEGER NOT NULL DEFAULT 0,
 output_tokens INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS prompts (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
version INTEGER NOT NULL DEFAULT 1,
template TEXT NOT NULL,
model TEXT,
config TEXT,
created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
user_id TEXT,
UNIQUE(name, version)
)`,
	`CREATE TABLE IF NOT EXISTS webhooks (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 url TEXT NOT NULL,
 secret TEXT,
 events TEXT NOT NULL DEFAULT '[]',
 headers TEXT,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS batch_jobs (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending',
 items TEXT NOT NULL DEFAULT '[]',
 results TEXT NOT NULL DEFAULT '[]',
 error TEXT,
 progress INTEGER NOT NULL DEFAULT 0,
 total INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 started_at TEXT,
 ended_at TEXT
)`,
	`CREATE TABLE IF NOT EXISTS organizations (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL,
 owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 plan TEXT NOT NULL DEFAULT 'free',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS org_members (
 id TEXT PRIMARY KEY ,
 org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'member',
 joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(org_id, user_id)
)`,
	`CREATE TABLE IF NOT EXISTS invites (
 id TEXT PRIMARY KEY ,
 org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 email TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'member',
 token TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 used_at TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS files (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 filename TEXT NOT NULL,
 mime_type TEXT NOT NULL,
 size INTEGER NOT NULL DEFAULT 0,
 storage_key TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS stripe_customers (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 stripe_customer_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS stripe_invoices (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 stripe_invoice_id TEXT NOT NULL,
 amount INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS password_resets (
 id TEXT PRIMARY KEY ,
 email TEXT NOT NULL,
 token TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 used_at TEXT,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS webhook_deliveries (
id TEXT PRIMARY KEY,
webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
event_type TEXT NOT NULL,
payload TEXT NOT NULL,
status_code INTEGER,
error TEXT,
attempts INTEGER NOT NULL DEFAULT 0,
max_attempts INTEGER NOT NULL DEFAULT 5,
delivered_at TEXT,
next_retry_at TEXT,
created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
status TEXT NOT NULL DEFAULT 'pending'
)`,
	`CREATE TABLE IF NOT EXISTS rate_limit_tiers (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL UNIQUE,
 rpm INTEGER NOT NULL DEFAULT 60,
 tpm INTEGER NOT NULL DEFAULT 100000,
 rpd INTEGER NOT NULL DEFAULT 1000000,
 concurrent INTEGER NOT NULL DEFAULT 10,
 monthly_budget INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS providers (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,
 provider_type TEXT NOT NULL DEFAULT 'openai',
 base_url TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active',
 priority INTEGER NOT NULL DEFAULT 0,
 timeout_ms INTEGER NOT NULL DEFAULT 30000,
 circuit_breaker_enabled INTEGER NOT NULL DEFAULT 1,
 circuit_breaker_threshold INTEGER NOT NULL DEFAULT 5,
 circuit_breaker_recovery_ms INTEGER NOT NULL DEFAULT 30000,
 circuit_breaker_half_open_max INTEGER NOT NULL DEFAULT 3,
 max_retries INTEGER NOT NULL DEFAULT 3,
 rate_limit_rpm INTEGER NOT NULL DEFAULT 0,
 rate_limit_tpm INTEGER NOT NULL DEFAULT 0,
 metadata TEXT DEFAULT '[]',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS provider_keys (
 id TEXT PRIMARY KEY ,
 provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 label TEXT NOT NULL DEFAULT '',
 key_prefix TEXT NOT NULL DEFAULT '',
 key_hash TEXT NOT NULL,
 key_last_four TEXT NOT NULL DEFAULT '',
 encrypted_key TEXT NOT NULL DEFAULT '',
 strategy TEXT NOT NULL DEFAULT 'round-robin',
 weight INTEGER NOT NULL DEFAULT 1,
 sort_order INTEGER NOT NULL DEFAULT 0,
 fill_current INTEGER NOT NULL DEFAULT 0,
 rpm_limit INTEGER NOT NULL DEFAULT 0,
 tpm_limit INTEGER NOT NULL DEFAULT 0,
 monthly_quota INTEGER NOT NULL DEFAULT 0,
 monthly_used INTEGER NOT NULL DEFAULT 0,
 is_active INTEGER NOT NULL DEFAULT 1,
 usage_count INTEGER NOT NULL DEFAULT 0,
 total_tokens INTEGER NOT NULL DEFAULT 0,
 last_used_at TEXT,
 expires_at TEXT,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS provider_key_usage_logs (
 id INTEGER,
 key_id TEXT NOT NULL REFERENCES provider_keys(id) ON DELETE CASCADE,
 provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 request_id TEXT NOT NULL,
 user_id TEXT NOT NULL DEFAULT '',
 model TEXT NOT NULL DEFAULT '',
 tokens INTEGER NOT NULL DEFAULT 0,
 duration_ms INTEGER NOT NULL DEFAULT 0,
 status_code INTEGER NOT NULL DEFAULT 0,
 error TEXT DEFAULT '',
 cost INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS provider_health_checks (
 id INTEGER,
 provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 status TEXT NOT NULL,
 latency_ms INTEGER NOT NULL DEFAULT 0,
 error TEXT DEFAULT '',
 checked_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS model_registry (
id TEXT PRIMARY KEY,
model_id TEXT NOT NULL UNIQUE,
provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
display_name TEXT NOT NULL,
description TEXT DEFAULT '',
context_window INTEGER NOT NULL DEFAULT 4096,
max_output INTEGER NOT NULL DEFAULT 4096,
input_price_per_1k REAL NOT NULL DEFAULT 0,
output_price_per_1k REAL NOT NULL DEFAULT 0,
capabilities TEXT DEFAULT '[]',
supports_vision INTEGER NOT NULL DEFAULT 0,
supports_tools INTEGER NOT NULL DEFAULT 0,
supports_thinking INTEGER NOT NULL DEFAULT 0,
status TEXT NOT NULL DEFAULT 'active',
sunset_date TEXT,
replacement_model_id TEXT REFERENCES model_registry(id),
metadata TEXT DEFAULT '[]',
created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
model_group TEXT DEFAULT '',
fallback_models TEXT DEFAULT '[]',
credential_name TEXT DEFAULT '',
routing_weight INTEGER NOT NULL DEFAULT 1,
is_wildcard INTEGER NOT NULL DEFAULT 0
)`,
	`CREATE TABLE IF NOT EXISTS model_aliases (
 id TEXT PRIMARY KEY ,
 alias TEXT NOT NULL UNIQUE,
 target_model_id TEXT NOT NULL REFERENCES model_registry(id) ON DELETE CASCADE,
 preferred_provider_id TEXT REFERENCES providers(id),
 preferred_key_id TEXT REFERENCES provider_keys(id),
 rpm_override INTEGER NOT NULL DEFAULT 0,
 tpm_override INTEGER NOT NULL DEFAULT 0,
 monthly_budget INTEGER NOT NULL DEFAULT 0,
 allowed_user_ids TEXT DEFAULT '[]',
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS credit_adjustments (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 amount INTEGER NOT NULL,
 balance_before INTEGER NOT NULL DEFAULT 0,
 balance_after INTEGER NOT NULL DEFAULT 0,
 reason TEXT NOT NULL,
 admin_id TEXT NOT NULL REFERENCES users(id),
 reference_id TEXT DEFAULT '',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS usage_records (
 id INTEGER,
 user_id TEXT NOT NULL,
 api_key_id TEXT DEFAULT '',
 provider_id TEXT REFERENCES providers(id),
 request_id TEXT NOT NULL,
 model TEXT NOT NULL DEFAULT '',
 tokens INTEGER NOT NULL DEFAULT 0,
 cost INTEGER NOT NULL DEFAULT 0,
 duration_ms INTEGER NOT NULL DEFAULT 0,
 status_code INTEGER NOT NULL DEFAULT 0,
 error TEXT DEFAULT '',
 ip_address TEXT DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS usage_daily (
 date DATE NOT NULL,
 user_id TEXT NOT NULL DEFAULT '',
 provider_id TEXT,
 model_id TEXT NOT NULL DEFAULT '',
 api_key_id TEXT DEFAULT '',
 request_count INTEGER NOT NULL DEFAULT 0,
 tokens INTEGER NOT NULL DEFAULT 0,
 cost INTEGER NOT NULL DEFAULT 0,
 errors INTEGER NOT NULL DEFAULT 0,
 latency_p50_ms INTEGER NOT NULL DEFAULT 0,
 latency_p95_ms INTEGER NOT NULL DEFAULT 0,
 latency_p99_ms INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (date, user_id, model_id, api_key_id)
)`,
	`CREATE TABLE IF NOT EXISTS system_settings (
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL,
 type TEXT NOT NULL DEFAULT 'string',
 description TEXT DEFAULT '',
 group_name TEXT DEFAULT 'general',
 is_encrypted INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS feature_flags (
 id TEXT PRIMARY KEY ,
 key TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 description TEXT DEFAULT '',
 enabled INTEGER NOT NULL DEFAULT 0,
 targeted_user_ids TEXT DEFAULT '[]',
 targeted_tier_ids TEXT DEFAULT '[]',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS audit_logs (
 id INTEGER,
 actor_id TEXT NOT NULL,
 actor_email TEXT NOT NULL DEFAULT '',
 action TEXT NOT NULL,
 target_type TEXT NOT NULL DEFAULT '',
 target_id TEXT NOT NULL DEFAULT '',
 changes TEXT DEFAULT '[]',
 ip_address TEXT DEFAULT '',
 severity TEXT NOT NULL DEFAULT 'info',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS admin_users (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'admin',
 permissions TEXT DEFAULT '[]',
 is_active INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS admin_role_permissions (
 id TEXT PRIMARY KEY ,
 role TEXT NOT NULL UNIQUE,
 permissions TEXT NOT NULL DEFAULT '[]'
)`,
	`CREATE TABLE IF NOT EXISTS ip_lists (
 id TEXT PRIMARY KEY ,
 ip_or_cidr TEXT NOT NULL,
 action TEXT NOT NULL,
 scope TEXT NOT NULL DEFAULT 'global',
 scope_id TEXT DEFAULT '',
 reason TEXT DEFAULT '',
 expires_at TEXT,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS ip_access_logs (
 id INTEGER,
 ip_address TEXT NOT NULL,
 user_id TEXT DEFAULT '',
 api_key_id TEXT DEFAULT '',
 method TEXT NOT NULL DEFAULT '',
 path TEXT NOT NULL DEFAULT '',
 user_agent TEXT DEFAULT '',
 country TEXT DEFAULT '',
 is_proxy INTEGER NOT NULL DEFAULT 0,
 blocked INTEGER NOT NULL DEFAULT 0,
 rate_limited INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS suspicious_activities (
 id INTEGER,
 category TEXT NOT NULL,
 severity TEXT NOT NULL DEFAULT 'medium',
 user_id TEXT DEFAULT '',
 api_key_id TEXT DEFAULT '',
 ip TEXT DEFAULT '',
 details TEXT DEFAULT '[]',
 auto_blocked INTEGER NOT NULL DEFAULT 0,
 reviewed INTEGER NOT NULL DEFAULT 0,
 resolved INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS admin_impersonations (
 id TEXT PRIMARY KEY ,
 admin_id TEXT NOT NULL REFERENCES users(id),
 target_user_id TEXT NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL DEFAULT '',
 started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ended_at TEXT
)`,
	`CREATE TABLE IF NOT EXISTS announcements (
 id TEXT PRIMARY KEY ,
 title TEXT NOT NULL,
 body TEXT NOT NULL,
 priority TEXT NOT NULL DEFAULT 'normal',
 target_type TEXT NOT NULL DEFAULT 'all',
 target_ids TEXT DEFAULT '[]',
 starts_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ends_at TEXT,
 show_in_app INTEGER NOT NULL DEFAULT 1,
 send_email INTEGER NOT NULL DEFAULT 0,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS promo_codes (
 id TEXT PRIMARY KEY ,
 code TEXT NOT NULL UNIQUE,
 type TEXT NOT NULL,
 value INTEGER NOT NULL DEFAULT 0,
 max_uses INTEGER NOT NULL DEFAULT 0,
 current_uses INTEGER NOT NULL DEFAULT 0,
 min_purchase INTEGER NOT NULL DEFAULT 0,
 expires_at TEXT,
 is_active INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS promo_redemptions (
 id TEXT PRIMARY KEY ,
 promo_id TEXT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 discount INTEGER NOT NULL DEFAULT 0,
 credits_awarded INTEGER NOT NULL DEFAULT 0,
 redeemed_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS sso_configs (
 id TEXT PRIMARY KEY ,
 provider TEXT NOT NULL UNIQUE,
 label TEXT NOT NULL,
 issuer TEXT NOT NULL,
 client_id TEXT NOT NULL,
 client_secret TEXT NOT NULL DEFAULT '',
 allowed_domains TEXT DEFAULT '[]',
 auto_provision INTEGER NOT NULL DEFAULT 0,
 default_role TEXT NOT NULL DEFAULT 'user',
 metadata TEXT DEFAULT '[]',
 is_active INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS user_groups (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL UNIQUE,
 description TEXT DEFAULT '',
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS user_group_members (
 group_id TEXT NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY (group_id, user_id)
)`,
	`CREATE TABLE IF NOT EXISTS group_policies (
 id TEXT PRIMARY KEY ,
 group_id TEXT NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
 policy_type TEXT NOT NULL,
 settings TEXT NOT NULL DEFAULT '[]',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS scheduled_reports (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL,
 frequency TEXT NOT NULL,
 format TEXT NOT NULL DEFAULT 'json',
 sections TEXT NOT NULL DEFAULT '[]',
 recipients TEXT NOT NULL DEFAULT '[]',
 next_send_at TEXT,
 last_sent_at TEXT,
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS api_changelog (
 id TEXT PRIMARY KEY ,
 title TEXT NOT NULL,
 body TEXT NOT NULL,
 version TEXT NOT NULL DEFAULT '',
 type TEXT NOT NULL,
 published_at TEXT,
 is_draft INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS usage_alerts (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL,
 scope TEXT NOT NULL DEFAULT 'user',
 metric TEXT NOT NULL,
 threshold FLOAT NOT NULL DEFAULT 0,
 window_minutes INTEGER NOT NULL DEFAULT 60,
 channels TEXT NOT NULL DEFAULT '{"email"}',
 is_active INTEGER NOT NULL DEFAULT 1,
 cooldown_minutes INTEGER NOT NULL DEFAULT 1440,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS cost_optimizations (
 id INTEGER,
 type TEXT NOT NULL,
 title TEXT NOT NULL,
 description TEXT DEFAULT '',
 estimated_savings INTEGER NOT NULL DEFAULT 0,
 user_id TEXT DEFAULT '',
 applied INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS model_routing_rules (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL,
 priority INTEGER NOT NULL DEFAULT 0,
 conditions TEXT NOT NULL DEFAULT '[]',
 actions TEXT NOT NULL DEFAULT '[]',
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS usage_forecasts (
 id TEXT PRIMARY KEY ,
 forecast_date DATE NOT NULL,
 predicted_tokens INTEGER NOT NULL DEFAULT 0,
 predicted_cost INTEGER NOT NULL DEFAULT 0,
 confidence FLOAT NOT NULL DEFAULT 0.5,
 generated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS provider_ab_tests (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL,
 provider_a TEXT NOT NULL REFERENCES providers(id),
 provider_b TEXT NOT NULL REFERENCES providers(id),
 traffic_percent INTEGER NOT NULL DEFAULT 50,
 status TEXT NOT NULL DEFAULT 'running',
 criteria TEXT DEFAULT '[]',
 winner TEXT REFERENCES providers(id),
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS provider_sla (
 id TEXT PRIMARY KEY ,
 provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 date DATE NOT NULL,
 uptime FLOAT NOT NULL DEFAULT 100.0,
 latency_avg_ms FLOAT NOT NULL DEFAULT 0,
 error_rate FLOAT NOT NULL DEFAULT 0,
 UNIQUE(provider_id, date)
)`,
	`CREATE TABLE IF NOT EXISTS data_exports (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id),
 requested_by TEXT NOT NULL REFERENCES users(id),
 reason TEXT DEFAULT '',
 format TEXT NOT NULL DEFAULT 'json',
 status TEXT NOT NULL DEFAULT 'pending',
 file_path TEXT DEFAULT '',
 expires_at TEXT,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 completed_at TEXT
)`,
	`CREATE TABLE IF NOT EXISTS request_traces (
 id TEXT PRIMARY KEY ,
 request_id TEXT NOT NULL UNIQUE,
 trace_data TEXT NOT NULL DEFAULT '[]',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS model_benchmarks (
 id TEXT PRIMARY KEY ,
 prompt_hash TEXT NOT NULL,
 prompt_text TEXT NOT NULL,
 results TEXT NOT NULL DEFAULT '[]',
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS provider_maintenance_windows (
 id TEXT PRIMARY KEY ,
 provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 description TEXT DEFAULT '',
 starts_at TEXT NOT NULL,
 ends_at TEXT NOT NULL,
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
id INTEGER,
webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
event_type TEXT NOT NULL,
payload TEXT,
response_status INTEGER,
duration_ms INTEGER NOT NULL DEFAULT 0,
success INTEGER NOT NULL DEFAULT 0,
attempt INTEGER NOT NULL DEFAULT 1,
created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
idempotency_key TEXT
)`,
	`CREATE TABLE IF NOT EXISTS webhook_tests (
 id TEXT PRIMARY KEY ,
 event_type TEXT NOT NULL,
 sample_payload TEXT DEFAULT '[]',
 target_url TEXT NOT NULL,
 response_status INTEGER,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS cache_stats (
 id INTEGER,
 provider_id TEXT REFERENCES providers(id),
 model TEXT NOT NULL DEFAULT '',
 hits INTEGER NOT NULL DEFAULT 0,
 misses INTEGER NOT NULL DEFAULT 0,
 hit_rate FLOAT NOT NULL DEFAULT 0.0,
 size_bytes INTEGER NOT NULL DEFAULT 0,
 recorded_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS admin_sessions (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL DEFAULT '',
 ip_address TEXT NOT NULL DEFAULT '',
 user_agent TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'active',
 expires_at TEXT NOT NULL,
 revoked_at TEXT,
 revoked_by TEXT REFERENCES users(id),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS permissions (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL UNIQUE,
 description TEXT,
 resource TEXT NOT NULL,
 action TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS role_permissions (
 id TEXT PRIMARY KEY ,
 role TEXT NOT NULL,
 permission_name TEXT NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(role, permission_name)
)`,
	`CREATE TABLE IF NOT EXISTS budget_alerts (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 threshold_percent INTEGER NOT NULL CHECK (threshold_percent BETWEEN 1 AND 100),
 alert_type TEXT NOT NULL DEFAULT 'email',
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS budget_caps (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 hard_limit INTEGER NOT NULL,
 soft_limit INTEGER,
 action_on_exceed TEXT NOT NULL DEFAULT 'block',
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(user_id)
)`,
	`CREATE TABLE IF NOT EXISTS ab_comparisons (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 model_a TEXT NOT NULL,
 model_b TEXT NOT NULL,
 prompt TEXT NOT NULL,
 result_a TEXT,
 result_b TEXT,
 latency_a INTEGER,
 latency_b INTEGER,
 cost_a INTEGER,
 cost_b INTEGER,
 tokens_a INTEGER,
 tokens_b INTEGER,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS fine_tuning_datasets (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 filename TEXT NOT NULL,
 mime_type TEXT,
 size INTEGER NOT NULL,
 storage_key TEXT NOT NULL,
 format TEXT NOT NULL DEFAULT 'jsonl',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 base_model TEXT NOT NULL,
 dataset_id TEXT REFERENCES fine_tuning_datasets(id),
 status TEXT NOT NULL DEFAULT 'pending',
 result_model_id TEXT,
 hyperparams TEXT,
 progress INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 started_at TEXT,
 finished_at TEXT
)`,
	`CREATE TABLE IF NOT EXISTS provider_plugins (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL UNIQUE,
 type TEXT NOT NULL DEFAULT 'custom',
 base_url TEXT NOT NULL,
 api_key_env TEXT,
 model_list_endpoint TEXT DEFAULT '/v1/models',
 chat_endpoint TEXT DEFAULT '/v1/chat/completions',
 embedding_endpoint TEXT DEFAULT '/v1/embeddings',
 headers TEXT,
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS export_jobs (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 type TEXT NOT NULL,
 format TEXT NOT NULL DEFAULT 'csv',
 status TEXT NOT NULL DEFAULT 'pending',
 file_path TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 completed_at TEXT
)`,
	`CREATE TABLE IF NOT EXISTS admin_messages (
 id TEXT PRIMARY KEY ,
 title TEXT NOT NULL,
 body TEXT NOT NULL,
 priority TEXT NOT NULL DEFAULT 'normal',
 target_type TEXT NOT NULL DEFAULT 'all',
 target_ids TEXT DEFAULT '[]',
 sent_by TEXT NOT NULL REFERENCES users(id),
 sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 expires_at TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS admin_message_reads (
 id TEXT PRIMARY KEY ,
 message_id TEXT NOT NULL REFERENCES admin_messages(id),
 user_id TEXT NOT NULL REFERENCES users(id),
 read_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS user_rate_limits (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 tier TEXT NOT NULL DEFAULT 'free',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS token_blacklist (
 id TEXT PRIMARY KEY ,
 token_hash TEXT NOT NULL UNIQUE,
 user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS credential_vault (
 id TEXT PRIMARY KEY ,
 name TEXT NOT NULL UNIQUE,
 provider_type TEXT NOT NULL DEFAULT 'openai',
 api_key_encrypted TEXT NOT NULL,
 api_base TEXT DEFAULT '',
 extra_config TEXT DEFAULT '[]',
 description TEXT DEFAULT '',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS api_logs (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
 model TEXT NOT NULL,
 provider TEXT NOT NULL,
 input_tokens INTEGER NOT NULL DEFAULT 0,
 output_tokens INTEGER NOT NULL DEFAULT 0,
 cost INTEGER NOT NULL DEFAULT 0,
 latency INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'success',
 error_message TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE TABLE IF NOT EXISTS credit_transactions (
 id TEXT PRIMARY KEY ,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 amount INTEGER NOT NULL,
 type TEXT NOT NULL,
 description TEXT NOT NULL,
 related_log_id TEXT,
 stripe_payment_id TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
	`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
	`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key)`,
	`CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv_id ON conversation_messages (conversation_id)`,
	`CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages (created_at)`,
	`CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts (name)`,
	`CREATE INDEX IF NOT EXISTS idx_prompts_name_version ON prompts (name, version DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs (status)`,
	`CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id)`,
	`CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members (org_id)`,
	`CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_invites_org_id ON invites (org_id)`,
	`CREATE INDEX IF NOT EXISTS idx_invites_token ON invites (token)`,
	`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id ON stripe_invoices (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token)`,
	`CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets (email)`,
	`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries (webhook_id)`,
	`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries (event_type)`,
	`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries (created_at)`,
	`CREATE INDEX IF NOT EXISTS idx_rate_limit_tiers_name ON rate_limit_tiers (name)`,
	`CREATE INDEX IF NOT EXISTS idx_providers_status ON providers (status)`,
	`CREATE INDEX IF NOT EXISTS idx_providers_type ON providers (provider_type)`,
	`CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers (priority DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_provider_keys_provider_id ON provider_keys (provider_id)`,
	`CREATE INDEX IF NOT EXISTS idx_provider_keys_active ON provider_keys (provider_id, is_active)`,
	`CREATE INDEX IF NOT EXISTS idx_provider_keys_strategy ON provider_keys (strategy)`,
	`CREATE INDEX IF NOT EXISTS idx_provider_keys_sort_order ON provider_keys (provider_id, sort_order)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_pk_usage_request_id ON provider_key_usage_logs (request_id, created_at)`,
	`CREATE INDEX IF NOT EXISTS idx_pk_usage_key_id ON provider_key_usage_logs (key_id)`,
	`CREATE INDEX IF NOT EXISTS idx_pk_usage_provider_id ON provider_key_usage_logs (provider_id)`,
	`CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health_checks (provider_id, checked_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_model_registry_model_id ON model_registry (model_id)`,
	`CREATE INDEX IF NOT EXISTS idx_model_registry_provider ON model_registry (provider_id)`,
	`CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry (status)`,
	`CREATE INDEX IF NOT EXISTS idx_model_aliases_alias ON model_aliases (alias)`,
	`CREATE INDEX IF NOT EXISTS idx_model_aliases_active ON model_aliases (is_active)`,
	`CREATE INDEX IF NOT EXISTS idx_credit_adjustments_user ON credit_adjustments (user_id, created_at DESC)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_request_id ON usage_records (request_id, created_at)`,
	`CREATE INDEX IF NOT EXISTS idx_usage_records_user ON usage_records (user_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_usage_records_provider ON usage_records (provider_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_system_settings_group ON system_settings (group_name)`,
	`CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags (key)`,
	`CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags (enabled)`,
	`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users (is_active)`,
	`CREATE INDEX IF NOT EXISTS idx_ip_lists_action ON ip_lists (action)`,
	`CREATE INDEX IF NOT EXISTS idx_ip_lists_scope ON ip_lists (scope, scope_id)`,
	`CREATE INDEX IF NOT EXISTS idx_ip_access_ip ON ip_access_logs (ip_address, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_ip_access_blocked ON ip_access_logs (blocked, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_suspicious_category ON suspicious_activities (category, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_suspicious_user ON suspicious_activities (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_suspicious_reviewed ON suspicious_activities (reviewed, resolved)`,
	`CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes (is_active, expires_at)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_redemptions_unique ON promo_redemptions (promo_id, user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)`,
	`CREATE INDEX IF NOT EXISTS idx_users_rate_limit_tier ON users (rate_limit_tier_id)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions (user_id, created_at)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_sessions_status ON admin_sessions (status, expires_at)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions (token_hash)`,
	`CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login_at)`,
	`CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions (role)`,
	`CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions (resource)`,
	`CREATE INDEX IF NOT EXISTS idx_users_tier ON users (tier)`,
	`CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts (user_id, is_active)`,
	`CREATE INDEX IF NOT EXISTS idx_budget_caps_user ON budget_caps (user_id, is_active)`,
	`CREATE INDEX IF NOT EXISTS idx_ab_comparisons_user ON ab_comparisons (user_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_ab_comparisons_status ON ab_comparisons (status)`,
	`CREATE INDEX IF NOT EXISTS idx_ft_datasets_user ON fine_tuning_datasets (user_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_ft_jobs_user ON fine_tuning_jobs (user_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_ft_jobs_status ON fine_tuning_jobs (status)`,
	`CREATE INDEX IF NOT EXISTS idx_provider_plugins_active ON provider_plugins (is_active)`,
	`CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON export_jobs (user_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs (status)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_messages_sent_by ON admin_messages (sent_by)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_messages_target_type ON admin_messages (target_type)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_messages_sent_at ON admin_messages (sent_at)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_message_reads_message ON admin_message_reads (message_id)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_message_reads_user ON admin_message_reads (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_admin_message_reads_unique ON admin_message_reads (message_id, user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries (status)`,
	`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries (next_retry_at) WHERE next_retry_at IS NOT NULL`,
	`CREATE INDEX IF NOT EXISTS idx_webhook_logs_idempotency ON webhook_delivery_logs (idempotency_key, success) WHERE idempotency_key IS NOT NULL`,
	`CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_id ON user_rate_limits (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist (token_hash)`,
	`CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist (expires_at)`,
	`CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_model_registry_group ON model_registry (model_group) WHERE model_group != ''`,
	`CREATE INDEX IF NOT EXISTS idx_model_registry_wildcard ON model_registry (provider_id) WHERE is_wildcard = 1`,
	`CREATE INDEX IF NOT EXISTS idx_credential_vault_name ON credential_vault (name)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs (user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_user_created ON api_logs (user_id, created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_model ON api_logs (model)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_provider ON api_logs (provider)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs (status)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs (created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions (user_id)`,
}

// EnsureSQLiteColumns inspects the on-disk schema for `table` via
// PRAGMA table_info and runs `ALTER TABLE ... ADD COLUMN` for any column
// in `cols` that's missing. Idempotent across restarts.
func EnsureSQLiteColumns(ctx context.Context, sdb *sql.DB, table string, cols map[string]string) error {
	if sdb == nil {
		return fmt.Errorf("nil sqlite db")
	}
	if table == "" {
		return fmt.Errorf("empty table name")
	}
	if len(cols) == 0 {
		return nil
	}
	rows, err := sdb.QueryContext(ctx, "PRAGMA table_info("+table+")")
	if err != nil {
		return fmt.Errorf("pragma table_info %s: %w", table, err)
	}
	defer rows.Close()
	existing := make(map[string]struct{}, len(cols))
	for rows.Next() {
		var (
			cid     int
			name    string
			ctype   string
			notnull int
			pk      int
			dflt    sql.NullString
		)
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return fmt.Errorf("scan column info for %s: %w", table, err)
		}
		existing[name] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate column info for %s: %w", table, err)
	}
	for col, def := range cols {
		if _, ok := existing[col]; ok {
			continue
		}
		// SQLite ADD COLUMN requires a constant DEFAULT. Non-constant
		// expressions (strftime/NOW) fail — fall back to a nullable column.
		if _, err := sdb.ExecContext(ctx, "ALTER TABLE "+table+" ADD COLUMN "+col+" "+def); err != nil {
			fallback := stripNonConstantDefault(def)
			if fallback == def {
				return fmt.Errorf("add column %s.%s (%s): %w", table, col, def, err)
			}
			if _, err2 := sdb.ExecContext(ctx, "ALTER TABLE "+table+" ADD COLUMN "+col+" "+fallback); err2 != nil {
				return fmt.Errorf("add column %s.%s (%s then %s): %w / %v", table, col, def, fallback, err, err2)
			}
		}
	}
	return nil
}

// stripNonConstantDefault drops DEFAULT <expr> when the expression is not a
// SQLite-legal constant for ADD COLUMN (e.g. strftime(...)).
func stripNonConstantDefault(def string) string {
	// Match DEFAULT ( ... ) or DEFAULT strftime(...) etc.
	upper := strings.ToUpper(def)
	idx := strings.Index(upper, "DEFAULT")
	if idx < 0 {
		return def
	}
	// Keep type + nullability before DEFAULT; drop NOT NULL if present after stripping default.
	head := strings.TrimSpace(def[:idx])
	head = strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(head, "NOT NULL", ""), "not null", ""))
	return head
}

// LiteSeedDefaults seeds admin + demo users + credits + api keys + sample
// credit transactions when the SQLite DB is empty.
func LiteSeedDefaults(ctx context.Context, sdb *sql.DB) error {
	if sdb == nil {
		return fmt.Errorf("nil sqlite db")
	}

	tables := []string{"admin_users", "credit_transactions", "user_credits", "api_keys", "users"}
	for _, table := range tables {
		if _, err := sdb.ExecContext(ctx, "DELETE FROM "+table); err != nil {
			return fmt.Errorf("wipe %s: %w", table, err)
		}
	}

	adminHash, err := password.Hash("admin123")
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}
	userHash, err := password.Hash("user123")
	if err != nil {
		return fmt.Errorf("hash user password: %w", err)
	}

	adminID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:admin@example.com")).String()
	user1ID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:john@example.com")).String()
	user2ID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:jane@example.com")).String()

	users := []struct {
		id, name, email, pass, role string
	}{
		{adminID, "Admin User", "admin@example.com", string(adminHash), "admin"},
		{user1ID, "John Doe", "john@example.com", string(userHash), "user"},
		{user2ID, "Jane Smith", "jane@example.com", string(userHash), "user"},
	}
	for _, u := range users {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			u.id, u.name, u.email, u.pass, u.role, "1970-01-01T00:00:00Z",
		); err != nil {
			return fmt.Errorf("insert user %s: %w", u.email, err)
		}
	}

	if _, err := sdb.ExecContext(ctx,
		`INSERT INTO admin_users (user_id, role, permissions, is_active, created_by, created_at, updated_at)
		 VALUES (?, 'superadmin', '["*"]', 1, ?, '1970-01-01T00:00:00Z', '1970-01-01T00:00:00Z')`,
		adminID, adminID,
	); err != nil {
		return fmt.Errorf("insert admin_users: %w", err)
	}

	credits := []struct {
		id             string
		userID         string
		balance        int64
		totalPurchased int64
		totalSpent     int64
	}{
		{"credit-" + adminID, adminID, 1000000, 1000000, 0},
		{"credit-" + user1ID, user1ID, 500000, 750000, 250000},
		{"credit-" + user2ID, user2ID, 250000, 500000, 250000},
	}
	for _, c := range credits {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO user_credits (id, user_id, balance, total_purchased, total_spent) VALUES (?, ?, ?, ?, ?)`,
			c.id, c.userID, c.balance, c.totalPurchased, c.totalSpent,
		); err != nil {
			return fmt.Errorf("insert credits for %s: %w", c.userID, err)
		}
	}

	apiKeys := []struct {
		id, userID, name, key string
	}{
		{uuid.NewString(), user1ID, "Production Key", "dra_prod_" + uuid.NewString()},
		{uuid.NewString(), user1ID, "Development Key", "dra_dev_" + uuid.NewString()},
		{uuid.NewString(), user2ID, "Personal Project", "dra_pers_" + uuid.NewString()},
	}
	for _, k := range apiKeys {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO api_keys (id, user_id, name, key, last_used, created_at) VALUES (?, ?, ?, ?, NULL, ?)`,
			k.id, k.userID, k.name, k.key, "1970-01-01T00:00:00Z",
		); err != nil {
			return fmt.Errorf("insert api_key %s: %w", k.name, err)
		}
	}

	transactions := []struct {
		userID, typ, description string
		amount                   int64
	}{
		{adminID, "purchase", "Initial credit purchase", 1000000},
		{user1ID, "purchase", "Credit purchase via Stripe", 500000},
		{user1ID, "purchase", "Credit purchase via Stripe", 250000},
		{user1ID, "usage", "API usage deduction", -121500},
		{user2ID, "purchase", "Credit purchase via Stripe", 500000},
		{user2ID, "usage", "API usage deduction", -250000},
		{user2ID, "bonus", "Welcome bonus credits", 50000},
	}
	for _, tx := range transactions {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO credit_transactions (id, user_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			uuid.NewString(), tx.userID, tx.amount, tx.typ, tx.description, "1970-01-01T00:00:00Z",
		); err != nil {
			return fmt.Errorf("insert credit_transaction: %w", err)
		}
	}

	// Rate-limit tiers (mirrors migrations/009_rate_limits.sql seed). Skipped
	// previously in SQLite because autoMigrateSQLite never reads migrations/*.sql.
	tiers := []struct {
		id, name                           string
		rpm, tpm, rpd, concurrent, monthly int64
	}{
		{uuid.NewString(), "free", 20, 10000, 1000, 1, 0},
		{uuid.NewString(), "starter", 60, 100000, 10000, 5, 0},
		{uuid.NewString(), "pro", 200, 500000, 100000, 20, 0},
		{uuid.NewString(), "enterprise", 1000, 5000000, 1000000, 100, 0},
	}
	for _, t := range tiers {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO rate_limit_tiers (id, name, rpm, tpm, rpd, concurrent, monthly_budget)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			t.id, t.name, t.rpm, t.tpm, t.rpd, t.concurrent, t.monthly,
		); err != nil {
			return fmt.Errorf("insert rate_limit_tier %s: %w", t.name, err)
		}
	}

	// RBAC permissions + the superadmin role mapping (mirrors
	// migrations/008_rbac.sql). Without these, RequirePermission("providers.write")
	// etc. can't resolve for the seeded admin in SQLite mode.
	permissions := []string{
		"users.read", "users.write",
		"providers.read", "providers.write",
		"models.read", "models.write",
		"billing.read", "billing.write",
		"settings.read", "settings.write",
		"audit.read",
		"superadmin",
	}
	for _, p := range permissions {
		if _, err := sdb.ExecContext(ctx,
			`INSERT OR IGNORE INTO permissions (name, resource, action) VALUES (?, '', '')`, p,
		); err != nil {
			return fmt.Errorf("insert permission %s: %w", p, err)
		}
	}
	// Grant every permission to the superadmin role via role_permissions.
	for _, p := range permissions {
		if _, err := sdb.ExecContext(ctx,
			`INSERT OR IGNORE INTO role_permissions (role, permission_name) VALUES ('superadmin', ?)`, p,
		); err != nil {
			return fmt.Errorf("insert role_permission %s: %w", p, err)
		}
	}
	// admin_role_permissions stores the wildcard permission set for the role.
	if _, err := sdb.ExecContext(ctx,
		`INSERT OR IGNORE INTO admin_role_permissions (role, permissions) VALUES ('superadmin', '["*"]')`,
	); err != nil {
		return fmt.Errorf("insert admin_role_permission: %w", err)
	}

	// System settings base (mirrors migrations/019_docs_base_url.sql).
	if _, err := sdb.ExecContext(ctx,
		`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('docs_base_url', '/docs')`,
	); err != nil {
		return fmt.Errorf("insert system_settings: %w", err)
	}

	logger.Info("lite_seed_complete")
	return nil
}
