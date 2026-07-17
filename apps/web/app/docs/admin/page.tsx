"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Settings,
  Cpu,
  CreditCard,
  Activity,
  Lock,
  Eye,
  Megaphone,
  Key,
  ToggleLeft,
  BarChart3,
  Bell,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Section } from "@/components/docs/Section";
import { DocsSubhead } from "@/components/docs/DocsCard";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { TipBox } from "@/components/docs/TipBox";
import { EndpointCard } from "@/components/docs/EndpointCard";

import { getDocsBaseUrl } from "@/lib/docs-config";

const BASE_URL = getDocsBaseUrl();

export default function AdminPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      <Section
        id="admin"
        icon={Shield}
        eyebrow="Platform"
        title="Admin"
        italic="API"
        description="The admin API provides full platform management. All admin endpoints require authentication and admin role. Many write operations require specific RBAC permissions (e.g. users.write, providers.write, billing.write)."
      >
        {/* Setup / Bootstrap */}
        <div className="mt-8">
          <DocsSubhead>First-time setup</DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            When no admin exists yet, two unauthenticated endpoints allow
            initial platform bootstrap. Once the first admin is created, these
            endpoints return 403.
          </p>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/setup/status"
              description="Check whether initial admin bootstrap is needed. Returns { needsSetup: true/false }."
            />
            <EndpointCard
              method="POST"
              path="/api/setup/bootstrap"
              description="Create the first admin account. Only available when no admin exists. Returns admin credentials and JWT."
            />
          </div>
        </div>

        {/* Dashboard & Stats */}
        <div className="mt-14">
          <DocsSubhead>Dashboard & statistics</DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/dashboard"
              description="Dashboard summary: total users, requests, credits spent, active providers."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/stats"
              description="General platform statistics across all users and time ranges."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/analytics"
              description="Comprehensive analytics data across all users with filtering."
            />
          </div>
        </div>

        {/* User management */}
        <div className="mt-14">
          <DocsSubhead>User management</DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/users"
              description="List all platform users with pagination and search."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/users/{id}"
              description="Get detailed user profile including role, status, and usage."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/users/{id}/status"
              description="Update user status (active, suspended). Requires users.write."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/users/{id}/role"
              description="Update user role. Requires users.write."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/users/{id}"
              description="Delete a user account permanently. Requires users.write."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/users/{id}/impersonate"
              description="Start an admin impersonation session. Requires users.write."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/impersonations/{id}/stop"
              description="Stop an impersonation session."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/users/bulk/suspend"
              description="Bulk suspend multiple users. Requires users.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/users/{id}/keys"
              description="List API keys for a specific user."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/users/{id}/usage"
              description="List user usage logs with model and cost details."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/users/{id}/adjustments"
              description="List credit adjustment history for a user."
            />
          </div>
        </div>

        {/* Provider management */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            Provider management
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/providers"
              description="List all configured LLM providers with health status."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/providers"
              description="Add a new LLM provider configuration. Requires providers.write."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/providers/fetch-models"
              description="Fetch and import available models from a provider. Requires providers.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/providers/{id}"
              description="Get provider configuration details."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/providers/{id}"
              description="Update provider configuration. Requires providers.write."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/providers/{id}/status"
              description="Enable, disable, or update provider status. Requires providers.write."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/providers/{id}"
              description="Delete a provider. Requires providers.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/providers/{id}/keys"
              description="List provider API keys."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/providers/{id}/keys"
              description="Add a new API key to a provider. Requires providers.write."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/providers/{id}/keys/{keyId}"
              description="Delete a provider API key. Requires providers.write."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/providers/{id}/keys/reorder"
              description="Reorder provider key priority. Requires providers.write."
            />
          </div>
        </div>

        {/* Model & alias management */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Model & alias management
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/models"
              description="List all managed models with pricing and capabilities."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/models"
              description="Create a model entry. Requires models.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/models/{id}"
              description="Get model details."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/models/{id}"
              description="Update model configuration. Requires models.write."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/models/{id}/status"
              description="Enable or disable a model. Requires models.write."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/models/{id}"
              description="Delete a model entry. Requires models.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/aliases"
              description="List model aliases (e.g. gpt-4 → openai/gpt-4o)."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/aliases"
              description="Create a model alias. Requires models.write."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/aliases/{id}"
              description="Update a model alias. Requires models.write."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/aliases/{id}"
              description="Delete a model alias. Requires models.write."
            />
          </div>
        </div>

        {/* Billing */}
        <div className="mt-14">
          <DocsSubhead>Billing & credits</DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/billing/summary"
              description="Revenue and billing summary across the platform."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/billing/transactions"
              description="List all billing transactions with filtering."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/billing/credits/adjust"
              description="Adjust a user's credit balance (add or deduct). Requires billing.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/billing/usage-daily"
              description="Daily usage and billing data aggregation."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/cost/optimizations"
              description="List cost optimization suggestions based on usage patterns."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/cost/forecast"
              description="Get cost forecast based on current usage trends."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/cost/breakdown"
              description="Get detailed cost breakdown by model, provider, and time."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/pricing"
              description="List pricing data from the usage tracker."
            />
          </div>
        </div>

        {/* Settings & feature flags */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            Settings & feature flags
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/settings"
              description="List all platform settings (rate limits, branding, features)."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/settings/{key}"
              description="Update a specific setting by key. Requires settings.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/feature-flags"
              description="List all feature flags and their current state."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/feature-flags"
              description="Create a new feature flag. Requires settings.write."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/feature-flags/{id}"
              description="Toggle or update a feature flag. Requires settings.write."
            />
          </div>
        </div>

        {/* Security */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
            Security & audit
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/security/suspicious"
              description="List suspicious activity records flagged by the system."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/security/suspicious/{id}"
              description="Review and update a suspicious activity record."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/security/events"
              description="List recent security guard events."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/security/scan"
              description="Scan submitted text for security detections."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/ip"
              description="List IP allow/block entries."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/ip"
              description="Add an IP allow/block entry. Requires admin."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/ip/{id}"
              description="Remove an IP entry. Requires admin."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/logs/ip-access"
              description="List IP access logs for monitoring."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/audit"
              description="Full audit trail of all admin actions for compliance."
            />
          </div>
        </div>

        {/* RBAC */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
            RBAC (Role-Based Access Control)
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The admin API supports fine-grained RBAC. Roles have associated
            permissions that gate access to specific write operations.
          </p>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/rbac/permissions"
              description="List all available permissions."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/rbac/roles"
              description="List all roles."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/rbac/roles/{role}/permissions"
              description="List permissions assigned to a role."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/rbac/roles/{role}/permissions"
              description="Add a permission to a role."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/rbac/roles/{role}/permissions/{permission}"
              description="Remove a permission from a role."
            />
          </div>
        </div>

        {/* Rate limits */}
        <div className="mt-14">
          <DocsSubhead>Rate limit tiers</DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/rate-limits/tiers"
              description="List all rate limit tiers with their RPM, daily, and monthly limits."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/rate-limits/tiers/{tier}"
              description="Update tier limits (RPM, daily, monthly, max tokens)."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/users/{userId}/tier"
              description="Assign a rate limit tier to a specific user."
            />
          </div>
        </div>

        {/* Infrastructure */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            Infrastructure & caching
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/circuit-breakers"
              description="View circuit breaker states for all LLM providers."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/cache/stats"
              description="Get LLM response cache statistics (hit rate, size, evictions)."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/cache/clear"
              description="Clear the LLM response cache. Requires admin."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/load-balancer"
              description="Get load balancer endpoint statistics."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/provider-health-detailed"
              description="Detailed provider health metrics including latency and error rates."
            />
          </div>
        </div>

        {/* Announcements & messaging */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            Announcements & messaging
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/announcements"
              description="List all platform announcements."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/announcements"
              description="Create a new platform announcement."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/messages"
              description="List admin-targeted messages."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/messages/{id}"
              description="Get message details."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/messages"
              description="Create a targeted message to users (emits SSE notification)."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/messages/{id}"
              description="Delete an admin message."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/messages/{id}/stats"
              description="Get delivery and read stats for a message."
            />
          </div>
        </div>

        {/* Promo codes */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Promo codes
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/promos"
              description="List all promo codes."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/promos"
              description="Create a promo code with auto-generated code."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/promos/custom"
              description="Create a promo code with a custom code string."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/promos/{id}/toggle"
              description="Enable or disable a promo code."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/promos/{id}/redemptions"
              description="List redemption history for a promo code."
            />
          </div>
        </div>

        {/* Webhook management */}
        <div className="mt-14">
          <DocsSubhead>Webhook management</DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/webhooks/logs"
              description="List all webhook delivery logs across the platform."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/webhooks/{id}/retry"
              description="Manually retry a failed webhook delivery."
            />
          </div>
        </div>

        {/* Enterprise */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
            Enterprise features
          </DocsSubhead>
          <div className="space-y-2">
            <EndpointCard
              method="GET"
              path="/api/admin/credentials"
              description="List credential vault entries (keys masked). Requires providers.write."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/credentials"
              description="Add provider credential to vault. Requires providers.write."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/credentials/{id}/rotate"
              description="Rotate a vault credential's API key. Requires providers.write."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/credentials/{id}"
              description="Delete a vault credential. Requires providers.write."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/plugins"
              description="List provider plugins."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/plugins"
              description="Create a provider plugin."
            />
            <EndpointCard
              method="PUT"
              path="/api/admin/plugins/{id}/toggle"
              description="Enable or disable a provider plugin."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/plugins/{id}"
              description="Delete a provider plugin."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/sso"
              description="List SSO configurations."
            />
            <EndpointCard
              method="GET"
              path="/api/admin/admins"
              description="List admin users."
            />
            <EndpointCard
              method="POST"
              path="/api/admin/admins"
              description="Grant admin privileges to a user."
            />
            <EndpointCard
              method="DELETE"
              path="/api/admin/admins/{id}"
              description="Remove admin privileges."
            />
          </div>
        </div>

        <TipBox variant="warning">
          Admin error responses never leak internal details. The{" "}
          <code className="text-rose-200/80">adminError()</code> handler logs
          the full error server-side but returns a generic message to the
          client. Always check server logs for debugging admin operations.
        </TipBox>
      </Section>
    </motion.div>
  );
}
