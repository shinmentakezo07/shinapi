"use client";

import { motion } from "framer-motion";
import { Code2, Package, Terminal, ArrowRight } from "lucide-react";
import { Section } from "@/components/docs/Section";
import { DocsSubhead } from "@/components/docs/DocsCard";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { TipBox } from "@/components/docs/TipBox";

import { getDocsBaseUrl } from "@/lib/docs-config";

const BASE_URL = getDocsBaseUrl();

const SDK_METHODS = [
  { group: "Chat", methods: [
    { name: "chat(params)", desc: "Send a chat completion request. Supports streaming via stream: true." },
    { name: "chatStream(params)", desc: "Streaming chat with async iterator / SSE parsing." },
  ]},
  { group: "Embeddings", methods: [
    { name: "embed(params)", desc: "Generate embeddings from text input." },
  ]},
  { group: "Models", methods: [
    { name: "listModels()", desc: "List all available models with capabilities and pricing." },
    { name: "listModels(provider)", desc: "List models for a specific provider." },
  ]},
  { group: "Conversations", methods: [
    { name: "createConversation(params)", desc: "Create a new conversation thread." },
    { name: "listConversations()", desc: "List recent conversations." },
    { name: "getConversation(id)", desc: "Get conversation with full message history." },
    { name: "deleteConversation(id)", desc: "Delete a conversation permanently." },
    { name: "sendMessage(id, params)", desc: "Send a message and get AI response." },
  ]},
  { group: "Prompts", methods: [
    { name: "createPrompt(params)", desc: "Create a prompt template with variable placeholders." },
    { name: "listPrompts()", desc: "List all saved prompt templates." },
    { name: "getPrompt(name)", desc: "Get a template by name." },
    { name: "renderPrompt(name, variables)", desc: "Render a template with variable substitution." },
    { name: "deletePrompt(name)", desc: "Delete a prompt template." },
  ]},
  { group: "Batch", methods: [
    { name: "createBatch(params)", desc: "Submit a batch of chat requests." },
    { name: "getBatch(id)", desc: "Check batch job status and retrieve results." },
  ]},
  { group: "Files", methods: [
    { name: "uploadFiles(formData)", desc: "Upload image files for vision models." },
    { name: "listFiles()", desc: "List all uploaded files." },
  ]},
  { group: "Billing", methods: [
    { name: "getCredits()", desc: "Get current credit balance and spending." },
    { name: "purchaseCredits(params)", desc: "Purchase additional credits." },
    { name: "getTransactions()", desc: "List credit transaction history." },
    { name: "getBudget()", desc: "Get daily/monthly budget limits and spending." },
    { name: "setBudget(params)", desc: "Set budget limits." },
  ]},
  { group: "API Keys", methods: [
    { name: "listKeys()", desc: "List all API keys." },
    { name: "createKey(params)", desc: "Create a new API key with optional scopes." },
    { name: "revokeKey(id)", desc: "Revoke an API key (immediately disables it)." },
    { name: "deleteKey(id)", desc: "Permanently delete an API key." },
  ]},
  { group: "Webhooks", methods: [
    { name: "listWebhooks()", desc: "List configured webhook endpoints." },
    { name: "createWebhook(params)", desc: "Create a webhook endpoint." },
    { name: "getWebhook(id)", desc: "Get webhook configuration." },
    { name: "updateWebhook(id, params)", desc: "Update webhook settings." },
    { name: "deleteWebhook(id)", desc: "Delete a webhook endpoint." },
  ]},
  { group: "Organizations", methods: [
    { name: "listOrganizations()", desc: "List organizations you belong to." },
    { name: "createOrganization(params)", desc: "Create a new organization." },
    { name: "getOrganization(id)", desc: "Get organization details." },
    { name: "listMembers(orgId)", desc: "List organization members." },
    { name: "inviteMember(orgId, params)", desc: "Invite a user to an organization." },
    { name: "acceptInvite(token)", desc: "Accept an organization invitation." },
  ]},
  { group: "Analytics", methods: [
    { name: "getAnalytics(params)", desc: "Get usage analytics over time." },
    { name: "getLogs(params)", desc: "Paginated request logs." },
  ]},
];

export default function SDKPage() {
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
        id="sdk"
        icon={Code2}
        eyebrow="Reference"
        title="SDK"
        italic="Reference"
        description="Yapapa provides a typed TypeScript SDK for frontend and Node.js integration, plus a Go SDK for backend services. Both implement the same API surface with ~40 methods."
      >
        {/* TypeScript SDK */}
        <div className="mt-8">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            TypeScript SDK
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The TypeScript SDK is available at{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">
              @/lib/api/sdk
            </code>{" "}
            in the web app. Use <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">getSDK()</code> to
            get an authenticated instance, or create a <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">DraSDK</code> with
            a custom base URL and API key.
          </p>
          <CodeBlock
            language="typescript"
            code={`import { getSDK } from "@/lib/api/sdk";

// Use authenticated SDK (reads session automatically)
const sdk = getSDK();

// Chat completion
const response = await sdk.chat({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});

// Streaming
for await (const chunk of sdk.chatStream({
  model: "openai/gpt-4o",
  stream: true,
  messages: [{ role: "user", content: "Hello!" }],
})) {
  process.stdout.write(chunk);
}

// List models
const models = await sdk.listModels();

// Check credits
const credits = await sdk.getCredits();`}
          />
        </div>

        {/* SDK with custom auth */}
        <div className="mt-10">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            Custom SDK instance
          </DocsSubhead>
          <CodeBlock
            language="typescript"
            code={`import { DraSDK } from "@/lib/api/sdk";

// Create SDK with custom base URL and API key
const sdk = new DraSDK({
  baseUrl: "${BASE_URL}",
  apiKey: "YOUR_API_KEY",
});

// Now use all methods
const data = await sdk.chat({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});`}
          />
        </div>

        {/* React Query hooks */}
        <div className="mt-10">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            React Query hooks
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The SDK is wrapped with React Query hooks for automatic caching, refetching,
            and loading states. Import from{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">
              @/lib/api/hooks
            </code>.
          </p>
          <CodeBlock
            language="typescript"
            code={`import {
  useModels,
  useCredits,
  useConversations,
  useLogs,
  useAnalytics,
} from "@/lib/api/hooks";

function MyComponent() {
  const { data: models, isLoading } = useModels();
  const { data: credits } = useCredits();
  const { data: conversations } = useConversations();
  const { data: logs } = useLogs({ page: 1, limit: 20 });
  const { data: analytics } = useAnalytics({ period: "7d" });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Credits: {credits?.balance}</p>
      <p>Models: {models?.length}</p>
    </div>
  );
}`}
          />
        </div>

        {/* Go SDK */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            Go SDK
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The Go SDK lives at{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">
              pkg/sdk/
            </code>{" "}
            in the backend. It implements the same ~40 methods as the TypeScript SDK
            for server-to-server integration.
          </p>
          <CodeBlock
            language="go"
            code={`import sdk "dra-platform/backend/pkg/sdk"

client := sdk.NewClient(sdk.Config{
    BaseURL: "${BASE_URL}",
    APIKey:  "YOUR_API_KEY",
})

// Chat completion
resp, err := client.Chat(ctx, sdk.ChatRequest{
    Model:    "openai/gpt-4o",
    Messages: []sdk.Message{
        {Role: "user", Content: "Hello!"},
    },
})

// List models
models, err := client.ListModels(ctx)

// Get credits
credits, err := client.GetCredits(ctx)`}
          />
        </div>

        {/* OpenAI SDK drop-in */}
        <div className="mt-14">
          <DocsSubhead>
            OpenAI SDK drop-in
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            You can also use the official OpenAI SDK by changing only the base URL.
            This is the fastest way to migrate existing applications.
          </p>
          <CodeBlock
            examples={{
              python: `from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}/v1",
    api_key="YOUR_YAPAPA_API_KEY",
)

response = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)`,
              js: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${BASE_URL}/v1",
  apiKey: "YOUR_YAPAPA_API_KEY",
});

const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`,
              curl: `curl ${BASE_URL}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: YOUR_YAPAPA_API_KEY" \\
  -d '{
    "model": "openai/gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
              go: `import "github.com/openai/openai-go/v3"

client := openai.NewClient(
    openai.WithBaseURL("${BASE_URL}/v1"),
    openai.WithAPIKey("YOUR_YAPAPA_API_KEY"),
)`,
            }}
          />
        </div>

        {/* Method reference */}
        <div className="mt-14">
          <DocsSubhead>
            Method reference
          </DocsSubhead>
          <div className="space-y-6">
            {SDK_METHODS.map((group) => (
              <div key={group.group}>
                <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-indigo-200/55 mb-3">
                  {group.group}
                </h4>
                <div className="space-y-1.5">
                  {group.methods.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-start gap-4 p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
                    >
                      <code className="text-[12px] font-mono text-indigo-200/80 whitespace-nowrap flex-shrink-0 min-w-[220px]">
                        {m.name}
                      </code>
                      <span className="text-xs text-white/40 leading-[1.6]">{m.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <TipBox variant="info">
          Dashboard components MUST use the SDK via <code>getSDK()</code> or React Query hooks
          from <code>@/lib/api/hooks</code>. Mock data is forbidden and enforced by the
          wiring verification test suite.
        </TipBox>
      </Section>
    </motion.div>
  );
}
