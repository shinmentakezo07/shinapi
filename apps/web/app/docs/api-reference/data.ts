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
      { method: "POST", path: "/api/prompts", description: "Create a new prompt template with name, content, and optional variables." },
      { method: "GET", path: "/api/prompts", description: "List saved prompt templates." },
      { method: "GET", path: "/api/prompts/{name}", description: "Get a specific prompt template by name." },
      { method: "POST", path: "/api/prompts/{name}/render", description: "Render a prompt template with variable substitution and model selection." },
      { method: "DELETE", path: "/api/prompts/{name}", description: "Delete a prompt template by name." },
      { method: "POST", path: "/api/batch", description: "Process multiple requests in a single batch." },
      { method: "GET", path: "/api/batch/{id}", description: "Check batch job status and results." },
      { method: "POST", path: "/api/files/upload", description: "Upload files for multimodal model support." },
      { method: "GET", path: "/api/models", description: "List all available AI models." },
      { method: "GET", path: "/api/models/{provider}", description: "List models for a specific provider." },
      { method: "GET", path: "/api/credits/budget", description: "Get daily and monthly budget limits with current spending." },
      { method: "PUT", path: "/api/credits/budget", description: "Set daily and/or monthly budget limits." },
      { method: "GET", path: "/api/files", description: "List all uploaded files for the current user." },
      { method: "POST", path: "/api/validate", description: "Validate structured output schemas and constraints." },
      { method: "GET", path: "/api/notifications/stream", description: "Real-time Server-Sent Events (SSE) stream for live notifications." },
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
