import {
  type LucideIcon,
  Globe,
  Lock,
  Zap,
  Shield,
  Webhook,
  Users,
  CreditCard,
  Settings,
  Cpu,
  Activity,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import { getDocsBaseUrl } from "@/lib/docs-config";

export interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  example?: string;
}

export interface ApiCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  endpoints: Endpoint[];
}

const BASE_URL = getDocsBaseUrl();

function makeExample(endpoint: Endpoint): string {
  if (endpoint.example) return endpoint.example;
  const url = `${BASE_URL}${endpoint.path}`;
  const authHeader =
    endpoint.auth !== false
      ? ' \\\n  -H "Authorization: Bearer YOUR_JWT"'
      : "";
  if (endpoint.method === "GET" || endpoint.method === "DELETE") {
    return `curl -X ${endpoint.method}${authHeader} \\\n  ${url}`;
  }
  return `curl -X ${endpoint.method}${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{}' \\\n  ${url}`;
}

export const API_CATEGORIES: ApiCategory[] = [
  {
    id: "public",
    label: "Public Endpoints",
    icon: Globe,
    color: "emerald",
    textColor: "text-emerald-200",
    bgColor: "bg-emerald-500/[0.08]",
    borderColor: "border-emerald-500/20",
    dotColor: "bg-emerald-400/70",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Health check including database connectivity.",
        auth: false,
        example: `curl ${BASE_URL}/health`,
      },
      {
        method: "POST",
        path: "/auth/signup",
        description: "Register a new user account.",
        auth: false,
        example: `curl -X POST ${BASE_URL}/auth/signup \\n  -H "Content-Type: application/json" \\n  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'`,
      },
      {
        method: "POST",
        path: "/auth/login",
        description: "Authenticate and receive JWT session.",
        auth: false,
        example: `curl -X POST ${BASE_URL}/auth/login \\n  -H "Content-Type: application/json" \\n  -d '{"email":"alice@example.com","password":"secret123"}'`,
      },
      {
        method: "GET",
        path: "/api/providers/health",
        description: "Health status of all configured LLM providers.",
        auth: false,
      },
      {
        method: "GET",
        path: "/health/providers",
        description:
          "Health status of all configured LLM providers with latency and last-checked info.",
        auth: false,
      },
    ],
  },
  {
    id: "protected",
    label: "Protected Endpoints",
    icon: Lock,
    color: "indigo",
    textColor: "text-indigo-200",
    bgColor: "bg-indigo-500/[0.08]",
    borderColor: "border-indigo-500/20",
    dotColor: "bg-indigo-400/70",
    endpoints: [
      { method: "GET", path: "/auth/me", description: "Get current authenticated user profile." },
      { method: "PUT", path: "/auth/profile", description: "Update user name and email." },
      { method: "PUT", path: "/auth/password", description: "Change password (requires current password)." },
      { method: "GET", path: "/api/keys", description: "List all API keys for the current user." },
      { method: "POST", path: "/api/keys", description: "Create a new API key with a name." },
      { method: "DELETE", path: "/api/keys/{id}", description: "Permanently delete an API key." },
      { method: "POST", path: "/api/keys/{id}/revoke", description: "Revoke an API key (immediately disables it)." },
      { method: "GET", path: "/api/logs", description: "Paginated request logs with model, status, tokens." },
      { method: "GET", path: "/api/analytics", description: "Usage analytics: requests, tokens, costs over time." },
      { method: "GET", path: "/api/credits", description: "Get current credit balance." },
      { method: "POST", path: "/api/credits/purchase", description: "Purchase additional credits." },
      { method: "GET", path: "/api/transactions", description: "List all credit transactions." },
      { method: "POST", path: "/api/chat", description: "Unified AI chat endpoint. Streams SSE responses." },
      { method: "POST", path: "/api/embeddings", description: "Generate embeddings from supported providers." },
      { method: "POST", path: "/api/conversations", description: "Create a new conversation thread." },
      { method: "GET", path: "/api/conversations", description: "List recent conversations." },
      { method: "GET", path: "/api/conversations/{id}", description: "Get full conversation with messages." },
      { method: "DELETE", path: "/api/conversations/{id}", description: "Delete a conversation." },
      { method: "POST", path: "/api/conversations/{id}/messages", description: "Add message and get AI response." },
      { method: "PUT", path: "/api/conversations/{id}/title", description: "Update conversation title." },
      { method: "POST", path: "/api/prompts", description: "Create a new prompt template with name, content, and optional variables." },
      { method: "GET", path: "/api/prompts", description: "List saved prompt templates." },
      { method: "GET", path: "/api/prompts/{name}", description: "Get a specific prompt template by name." },
      { method: "POST", path: "/api/prompts/{name}/render", description: "Render a prompt template with variable substitution and model selection." },
      { method: "DELETE", path: "/api/prompts/{name}", description: "Delete a prompt template by name." },
      { method: "POST", path: "/api/batch", description: "Process multiple requests in a single batch." },
      { method: "GET", path: "/api/batch", description: "List all batch jobs for the current user." },
      { method: "GET", path: "/api/batch/{id}", description: "Check batch job status and results." },
      { method: "DELETE", path: "/api/batch/{id}", description: "Cancel a running batch job." },
      { method: "POST", path: "/api/files/upload", description: "Upload files for multimodal model support." },
      { method: "GET", path: "/api/files", description: "List all uploaded files for the current user." },
      { method: "GET", path: "/api/models", description: "List all available AI models." },
      { method: "GET", path: "/api/models/{provider}", description: "List models for a specific provider." },
      { method: "GET", path: "/api/credits/budget", description: "Get daily and monthly budget limits with current spending." },
      { method: "PUT", path: "/api/credits/budget", description: "Set daily and/or monthly budget limits." },
      { method: "GET", path: "/api/budget/alerts", description: "List budget alert configurations." },
      { method: "POST", path: "/api/budget/alerts", description: "Create a budget alert (threshold + notification channel)." },
      { method: "DELETE", path: "/api/budget/alerts/{id}", description: "Delete a budget alert." },
      { method: "GET", path: "/api/budget/cap", description: "Get the current budget cap (hard spend limit)." },
      { method: "POST", path: "/api/budget/cap", description: "Create a budget cap." },
      { method: "PUT", path: "/api/budget/cap", description: "Update the budget cap." },
      { method: "DELETE", path: "/api/budget/cap", description: "Remove the budget cap." },
      { method: "GET", path: "/api/promos/redeem", description: "Redeem a promo code for credits." },
      { method: "POST", path: "/api/validate", description: "Validate structured output schemas and constraints." },
      { method: "GET", path: "/api/notifications/stream", description: "Real-time Server-Sent Events (SSE) stream for live notifications." },
      { method: "GET", path: "/api/messages", description: "Get admin-targeted messages for the current user." },
      { method: "GET", path: "/api/messages/unread-count", description: "Count unread targeted messages." },
      { method: "POST", path: "/api/messages/{id}/read", description: "Mark a message as read." },
      { method: "POST", path: "/api/messages/read-all", description: "Mark all messages as read." },
      { method: "GET", path: "/api/announcements", description: "Get active in-app announcements." },
      { method: "GET", path: "/api/comparisons", description: "List model A/B comparisons." },
      { method: "POST", path: "/api/comparisons", description: "Create a model comparison request." },
      { method: "GET", path: "/api/comparisons/{id}", description: "Get comparison details and results." },
      { method: "DELETE", path: "/api/comparisons/{id}", description: "Delete a comparison." },
      { method: "GET", path: "/api/fine-tuning/jobs", description: "List fine-tuning jobs." },
      { method: "POST", path: "/api/fine-tuning/jobs", description: "Create a fine-tuning job." },
      { method: "GET", path: "/api/fine-tuning/jobs/{jobId}", description: "Get fine-tuning job status." },
      { method: "GET", path: "/api/fine-tuning/datasets", description: "List fine-tuning datasets." },
      { method: "POST", path: "/api/fine-tuning/datasets", description: "Create a fine-tuning dataset." },
      { method: "DELETE", path: "/api/fine-tuning/datasets/{id}", description: "Delete a fine-tuning dataset." },
      { method: "GET", path: "/api/exports", description: "List data export jobs." },
      { method: "POST", path: "/api/exports", description: "Create a data export job." },
      { method: "GET", path: "/api/exports/{id}", description: "Get export job status." },
      { method: "GET", path: "/api/exports/{id}/download", description: "Download completed export file." },
      { method: "POST", path: "/api/keys/{id}", description: "Update API key metadata, scopes, or restrictions." },
      { method: "POST", path: "/auth/logout", description: "Logout and blacklist current session token." },
      { method: "DELETE", path: "/api/account", description: "Delete the current user account permanently." },
      { method: "GET", path: "/api/permissions/me", description: "Get current user RBAC permissions." },
      { method: "GET", path: "/api/webhooks/{id}/deliveries", description: "List delivery attempts for a webhook." },
      { method: "GET", path: "/api/webhooks", description: "List all configured webhook endpoints." },
      { method: "POST", path: "/api/webhooks", description: "Create a new webhook endpoint with event types and target URL." },
      { method: "GET", path: "/api/webhooks/{id}", description: "Get webhook configuration details and delivery status." },
      { method: "PUT", path: "/api/webhooks/{id}", description: "Update webhook endpoint URL, events, or settings." },
      { method: "DELETE", path: "/api/webhooks/{id}", description: "Delete a webhook endpoint." },
      { method: "GET", path: "/api/organizations", description: "List organizations you belong to or manage." },
      { method: "POST", path: "/api/organizations", description: "Create a new organization." },
      { method: "GET", path: "/api/organizations/{id}", description: "Get organization details and membership." },
      { method: "GET", path: "/api/organizations/{id}/members", description: "List members in an organization." },
      { method: "POST", path: "/api/organizations/{id}/invite", description: "Invite a user to your organization." },
      { method: "POST", path: "/api/organizations/{id}/members/{userId}", description: "Remove a member from the organization." },
      { method: "POST", path: "/api/invites/accept", description: "Accept a pending organization invitation." },
    ],
  },
  {
    id: "openai",
    label: "OpenAI-Compatible Endpoints",
    icon: Zap,
    color: "sky",
    textColor: "text-sky-200",
    bgColor: "bg-sky-500/[0.08]",
    borderColor: "border-sky-500/20",
    dotColor: "bg-sky-400/70",
    endpoints: [
      {
        method: "POST",
        path: "/v1/chat/completions",
        description: "OpenAI-compatible chat completions endpoint. Accepts standard OpenAI request format with streaming support.",
      },
      {
        method: "POST",
        path: "/v1/embeddings",
        description: "OpenAI-compatible embeddings endpoint. Returns embeddings in OpenAI response format.",
      },
      {
        method: "GET",
        path: "/v1/models",
        description: "OpenAI-compatible models list. Returns available models in OpenAI format.",
      },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic-Compatible Endpoints",
    icon: MessageSquare,
    color: "violet",
    textColor: "text-violet-200",
    bgColor: "bg-violet-500/[0.08]",
    borderColor: "border-violet-500/20",
    dotColor: "bg-violet-400/70",
    endpoints: [
      {
        method: "POST",
        path: "/v1/messages",
        description: "Anthropic-compatible Messages API. Supports streaming with Anthropic-native SSE events, tool use, and vision.",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin Endpoints",
    icon: Shield,
    color: "rose",
    textColor: "text-rose-200",
    bgColor: "bg-rose-500/[0.08]",
    borderColor: "border-rose-500/20",
    dotColor: "bg-rose-400/70",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/users",
        description: "[Admin] List all platform users with pagination and search.",
      },
      {
        method: "GET",
        path: "/api/admin/users/{id}",
        description: "[Admin] Get detailed user information including role, status, and usage.",
      },
      {
        method: "GET",
        path: "/api/admin/users/{id}/keys",
        description: "[Admin] List all API keys for a specific user.",
      },
      {
        method: "POST",
        path: "/api/admin/users/{id}/credits",
        description: "[Admin] Adjust user credit balance (add or deduct credits).",
      },
      {
        method: "GET",
        path: "/api/admin/settings",
        description: "[Admin] Get platform-wide settings including rate limits, features, and branding.",
      },
      {
        method: "PUT",
        path: "/api/admin/settings",
        description: "[Admin] Update platform settings.",
      },
      {
        method: "GET",
        path: "/api/admin/feature-flags",
        description: "[Admin] List all feature flags and their current state.",
      },
      {
        method: "PUT",
        path: "/api/admin/feature-flags/{flag}",
        description: "[Admin] Enable or disable a specific feature flag.",
      },
      {
        method: "GET",
        path: "/api/admin/circuit-breakers",
        description: "[Admin] View circuit breaker states for all LLM providers.",
      },
      {
        method: "GET",
        path: "/api/admin/providers",
        description: "[Admin] List all configured LLM providers with health status.",
      },
      {
        method: "POST",
        path: "/api/admin/providers",
        description: "[Admin] Add or update an LLM provider configuration.",
      },
      {
        method: "GET",
        path: "/api/admin/stats",
        description: "[Admin] Get platform-wide statistics: total users, requests, credits spent.",
      },
      {
        method: "GET",
        path: "/api/admin/logs",
        description: "[Admin] View platform-wide request logs with user context.",
      },
      {
        method: "GET",
        path: "/api/admin/audit-logs",
        description: "[Admin] Access audit trail of all admin actions for compliance.",
      },
      {
        method: "GET",
        path: "/api/admin/announcements",
        description: "[Admin] List all platform announcements.",
      },
      {
        method: "POST",
        path: "/api/admin/announcements",
        description: "[Admin] Create a new platform announcement.",
      },
      {
        method: "GET",
        path: "/api/admin/analytics",
        description: "[Admin] Get comprehensive analytics data across all users.",
      },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    icon: Webhook,
    color: "violet",
    textColor: "text-violet-200",
    bgColor: "bg-violet-500/[0.08]",
    borderColor: "border-violet-500/20",
    dotColor: "bg-violet-400/70",
    endpoints: [
      {
        method: "POST",
        path: "/webhooks/stripe",
        description: "Stripe webhook endpoint. Receives payment events (requires Stripe signature verification).",
        auth: false,
      },
    ],
  },
];

export { makeExample };
