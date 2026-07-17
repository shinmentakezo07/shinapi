"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  ArrowRight,
  Zap,
  Radio,
  Code2,
  Braces,
} from "lucide-react";
import { Section } from "@/components/docs/Section";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { TipBox } from "@/components/docs/TipBox";
import { EndpointCard } from "@/components/docs/EndpointCard";

import { getDocsBaseUrl } from "@/lib/docs-config";

const BASE_URL = getDocsBaseUrl();

const SSE_EVENTS = [
  {
    event: "message_start",
    desc: "Sent first. Contains the message ID, model, and input usage.",
    color: "text-indigo-200",
    bg: "bg-indigo-500/[0.06]",
    border: "border-indigo-500/15",
  },
  {
    event: "content_block_start",
    desc: "Signals the start of a content block (text or tool_use).",
    color: "text-sky-200",
    bg: "bg-sky-500/[0.06]",
    border: "border-sky-500/15",
  },
  {
    event: "content_block_delta",
    desc: "Incremental content delta. Contains partial text or tool input JSON.",
    color: "text-emerald-200",
    bg: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/15",
  },
  {
    event: "content_block_stop",
    desc: "Marks the end of a content block.",
    color: "text-violet-200",
    bg: "bg-violet-500/[0.06]",
    border: "border-violet-500/15",
  },
  {
    event: "message_delta",
    desc: "Contains stop_reason and output token usage for the message.",
    color: "text-amber-200",
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/15",
  },
  {
    event: "message_stop",
    desc: "Final event. Signals the message is complete.",
    color: "text-rose-200",
    bg: "bg-rose-500/[0.06]",
    border: "border-rose-500/15",
  },
];

export default function AnthropicPage() {
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
        id="anthropic"
        icon={MessageSquare}
        eyebrow="Compatibility"
        title="Anthropic"
        italic="Messages API"
        description="Yapapa provides full Anthropic Messages API compatibility at /v1/messages. Send requests using the Anthropic SDK or any client that speaks the Messages format — the gateway reuses the same auth, quota, and billing pipeline as the OpenAI-compatible endpoints."
      >
        {/* Endpoint card */}
        <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] via-white/[0.01] to-transparent p-5 mb-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-violet-500/[0.12] to-violet-600/[0.04] text-violet-200 text-[11px] font-mono font-bold border border-violet-500/20 shadow-sm">
                POST
              </span>
              <code className="text-white/80 font-mono text-sm tracking-tight">
                {BASE_URL}/v1/messages
              </code>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/[0.06] border border-violet-500/15 text-[9px] font-medium text-violet-200/70">
                <MessageSquare className="w-2.5 h-2.5" />
                Anthropic Format
              </span>
            </div>
          </div>
          <p className="text-sm text-white/55 leading-[1.75]">
            Accepts the standard Anthropic Messages API request format. Supports{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-violet-500/[0.08] text-violet-200/95 font-mono text-[13px] border border-violet-500/[0.12]">
              stream: true
            </code>{" "}
            for SSE streaming with Anthropic-native events.
          </p>
        </div>

        {/* Quick start with Anthropic SDK */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Using the Anthropic SDK
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Point the official Anthropic SDK at your Yapapa instance. Set the{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-violet-500/[0.08] text-violet-200/95 font-mono text-[13px] border border-violet-500/[0.12]">
              ANTHROPIC_BASE_URL
            </code>{" "}
            environment variable and use your Yapapa API key as the Anthropic
            API key.
          </p>
          <CodeBlock
            examples={{
              python: `from anthropic import Anthropic

client = Anthropic(
    base_url="${BASE_URL}",
    api_key="YOUR_YAPAPA_API_KEY",
)

message = client.messages.create(
    model="anthropic/claude-sonnet-4",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude!"}
    ],
)
print(message.content[0].text)`,
              js: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: "${BASE_URL}",
  apiKey: "YOUR_YAPAPA_API_KEY",
});

const message = await client.messages.create({
  model: "anthropic/claude-sonnet-4",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude!" }],
});
console.log(message.content[0].text);`,
              curl: `curl ${BASE_URL}/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_YAPAPA_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'`,
              go: `import anthropic "github.com/anthropics/anthropic-sdk-go"

client := anthropic.NewClient(
    anthropic.WithBaseURL("${BASE_URL}"),
    anthropic.WithAPIKey("YOUR_YAPAPA_API_KEY"),
)`,
            }}
          />
        </div>

        {/* Streaming with Anthropic events */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Streaming with Anthropic SSE events
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            When{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-violet-500/[0.08] text-violet-200/95 font-mono text-[13px] border border-violet-500/[0.12]">
              stream: true
            </code>{" "}
            is set, the response uses Anthropic-native SSE events instead of the
            OpenAI{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              data:
            </code>{" "}
            format. Each event type carries different data:
          </p>
          <div className="space-y-2">
            {SSE_EVENTS.map((evt) => (
              <div
                key={evt.event}
                className={`flex items-start gap-4 p-4 rounded-xl border ${evt.border} ${evt.bg}`}
              >
                <code
                  className={`text-[12px] font-mono font-semibold ${evt.color} whitespace-nowrap flex-shrink-0`}
                >
                  {evt.event}
                </code>
                <p className="text-xs text-white/45 leading-[1.6]">
                  {evt.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-white/95 font-semibold text-sm mb-3">
              Streaming example (Python)
            </h4>
            <CodeBlock
              language="python"
              code={`from anthropic import Anthropic

client = Anthropic(
    base_url="${BASE_URL}",
    api_key="YOUR_YAPAPA_API_KEY",
)

with client.messages.stream(
    model="anthropic/claude-sonnet-4",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain quantum computing"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`}
            />
          </div>
        </div>

        {/* System prompt handling */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            System prompts
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The Anthropic Messages API uses a dedicated{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              system
            </code>{" "}
            parameter instead of a system-role message. The gateway handles this
            conversion automatically when routing to other providers.
          </p>
          <CodeBlock
            language="python"
            code={`message = client.messages.create(
    model="anthropic/claude-sonnet-4",
    max_tokens=1024,
    system="You are a helpful assistant that explains technical concepts simply.",
    messages=[
        {"role": "user", "content": "What is a neural network?"}
    ],
)`}
          />
        </div>

        {/* Tool use */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Tool use (function calling)
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The Anthropic Messages endpoint supports tool use with the same{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              tools
            </code>{" "}
            parameter as the native Anthropic API. Tool definitions use
            Anthropic&apos;s schema format, and the gateway translates them for
            other providers when needed.
          </p>
          <CodeBlock
            language="python"
            code={`message = client.messages.create(
    model="anthropic/claude-sonnet-4",
    max_tokens=1024,
    tools=[{
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                }
            },
            "required": ["location"]
        }
    }],
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
)

# Check if the model wants to use a tool
if message.stop_reason == "tool_use":
    for block in message.content:
        if block.type == "tool_use":
            print(f"Tool: {block.name}")
            print(f"Input: {block.input}")`}
          />
        </div>

        {/* Compatibility notes */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Compatibility notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: "Model names",
                desc: "Use the provider prefix: anthropic/claude-sonnet-4, anthropic/claude-3-opus, etc. The gateway strips the prefix before calling the provider.",
              },
              {
                title: "Authentication",
                desc: "Use your Yapapa API key via the x-api-key header or Authorization: Bearer header. Both work. The anthropic-version header is accepted but optional.",
              },
              {
                title: "Vision support",
                desc: "Image content blocks (base64 and URL) are fully supported. The gateway normalizes image formats across providers.",
              },
              {
                title: "Token counting",
                desc: "Input and output token counts are returned in usage fields and also tracked by the billing/telemetry pipeline for credit deduction.",
              },
            ].map((note) => (
              <div
                key={note.title}
                className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.07] hover:border-violet-500/15 transition-all duration-200"
              >
                <h4 className="text-white/90 font-semibold text-xs mb-1.5">
                  {note.title}
                </h4>
                <p className="text-xs text-white/40 leading-[1.6]">
                  {note.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <TipBox variant="info">
          The <code>/v1/messages</code> endpoint reuses the same auth, quota,
          guardrails, caching, and billing pipeline as{" "}
          <code>/v1/chat/completions</code>. You can mix both endpoints in the
          same application — the gateway handles format translation
          transparently.
        </TipBox>
      </Section>
    </motion.div>
  );
}
