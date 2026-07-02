"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Zap,
  ArrowRightLeft,
  ShieldCheck,
  Coins,
  Repeat2,
  Terminal,
  Copy,
  Check,
  PlugZap,
  ChevronRight,
} from "lucide-react";
import { Section } from "@/components/docs/Section";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { TipBox } from "@/components/docs/TipBox";
import { cn } from "@/lib/utils";

import { getDocsBaseUrl } from "@/lib/docs-config";

const BASE_URL = getDocsBaseUrl();

/* ── Feature grid icons ── */
const FEATURES = [
  {
    icon: Zap,
    label: "Streaming",
    desc: "Server-Sent Events (SSE) with minimal latency chunks. Toggle via stream: true.",
  },
  {
    icon: ArrowRightLeft,
    label: "Model Switching",
    desc: "Change providers by changing the model string. No URL changes needed.",
  },
  {
    icon: ShieldCheck,
    label: "Retries & Fallbacks",
    desc: "Automatic retry with exponential backoff and provider failover.",
  },
  {
    icon: Coins,
    label: "Token Accounting",
    desc: "Tracks input and output tokens per request for usage analytics.",
  },
  {
    icon: Repeat2,
    label: "Auto-Retry",
    desc: "Transient failures are retried transparently without client changes.",
  },
  {
    icon: PlugZap,
    label: "OpenAI Compatible",
    desc: "Drop-in OpenAI SDK replacement via /v1/chat/completions endpoint.",
  },
];

/* ── Comparison cards ── */
const COMPARISON = [
  {
    title: "Unified endpoint",
    unified: "/api/chat",
    openai: "/v1/chat/completions",
    desc: "Use /api/chat for simplicity, /v1/chat/completions for OpenAI SDK compatibility. Both support streaming.",
  },
  {
    title: "Auth header",
    unified: "X-Api-Key",
    openai: "Authorization: Bearer",
    desc: "The unified endpoint expects X-Api-Key. The OpenAI endpoint mirrors the standard Bearer token header.",
  },
  {
    title: "Request body",
    unified: "Same JSON shape",
    openai: "Same JSON shape",
    desc: "Both endpoints accept identical payloads: model, messages, stream, temperature, etc.",
  },
];

/* ── Terminal dots ── */
const TRAFFIC = [
  { bg: "bg-red-500/50", ring: "ring-red-500/20" },
  { bg: "bg-amber-500/50", ring: "ring-amber-500/20" },
  { bg: "bg-emerald-500/50", ring: "ring-emerald-500/20" },
];

/* ── Mini copy button ── */
function MiniCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-mono text-white/30 hover:text-white/70 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
      aria-label="Copy"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-300" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

export default function ChatPage() {
  const [copyUrl, setCopyUrl] = useState(false);

  const handleCopyUrl = useCallback(() => {
    void navigator.clipboard.writeText(`${BASE_URL}/api/chat`);
    setCopyUrl(true);
    setTimeout(() => setCopyUrl(false), 2000);
  }, []);

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
        id="chat"
        icon={MessageSquare}
        eyebrow="Core Features"
        title="Chat &"
        italic="streaming"
        description="One chat endpoint that fronts every provider. Switch models by changing the model string. Toggle streaming with a single flag. Everything else — retries, fallbacks, token accounting — is handled by the gateway."
      >
        {/* ── Endpoint card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.06] via-white/[0.01] to-transparent p-5 mb-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500/[0.12] to-indigo-600/[0.04] text-indigo-200 text-[11px] font-mono font-bold border border-indigo-500/20 shadow-sm">
                POST
              </span>
              <code className="text-white/80 font-mono text-sm tracking-tight">
                {BASE_URL}/api/chat
              </code>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[9px] font-medium text-white/40">
                <Zap className="w-2.5 h-2.5" />
                Unified
              </span>
            </div>
          </div>
          <p className="text-sm text-white/55 leading-[1.75] mb-4">
            Accepts a standard JSON payload with model, messages, and optional
            parameters. Set{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">
              stream: true
            </code>{" "}
            to receive SSE chunks.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border border-indigo-500/20 text-indigo-200/80 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.1] transition-colors cursor-pointer"
            >
              {copyUrl ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Feature grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.35,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "group rounded-2xl border border-white/[0.07] p-5",
                "bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
                "hover:border-indigo-500/20 hover:shadow-[0_8px_24px_-12px_rgba(99,102,241,0.2)]",
                "transition-all duration-300"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center mb-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <f.icon className="w-4 h-4 text-indigo-200" />
              </div>
              <h4 className="text-sm font-semibold text-white/90 mb-1">
                {f.label}
              </h4>
              <p className="text-xs text-white/40 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Standard request ── */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(165,180,252,0.6)]" />
            Standard request
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Send a JSON payload with the model and messages array. The gateway
            routes to the correct provider, applies guardrails, and returns the
            response in a standard format.
          </p>
          <CodeBlock
            examples={{
              curl: `curl -N ${BASE_URL}/api/chat \\\n  -H "Content-Type: application/json" \\\n  -H "X-Api-Key: YOUR_API_KEY" \\\n  -d '{\n    "model": "openai/gpt-4o",\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }'`,
              js: `const response = await fetch("${BASE_URL}/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": "YOUR_API_KEY",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const data = await response.json();
console.log(data);`,
              python: `import requests

BASE = "${BASE_URL}"
API_KEY = "YOUR_API_KEY"

res = requests.post(
    f"{BASE}/api/chat",
    headers={
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
    },
    json={
        "model": "openai/gpt-4o",
        "messages": [{"role": "user", "content": "Hello!"}],
    },
)
print(res.json())`,
              go: `body, _ := json.Marshal(map[string]any{
    "model": "openai/gpt-4o",
    "messages": []map[string]string{
        {"role": "user", "content": "Hello!"},
    },
})

req, _ := http.NewRequest(
    "POST",
    "${BASE_URL}/api/chat",
    bytes.NewReader(body),
)
req.Header.Set("Content-Type", "application/json")
req.Header.Set("X-Api-Key", "YOUR_API_KEY")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()

var result map[string]any
json.NewDecoder(resp.Body).Decode(&result)
fmt.Printf("%+v\\n", result)`,
            }}
          />
        </div>

        {/* ── Streaming (SSE) ── */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(165,180,252,0.6)]" />
            Streaming (SSE)
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Set{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/[0.08] text-indigo-200/95 font-mono text-[13px] border border-indigo-500/[0.12]">
              stream: true
            </code>{" "}
            in the request body to receive a Server-Sent Events stream. Each chunk
            is a JSON object prefixed with{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              data:
            </code>
            , and the stream terminates with{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              data: [DONE]
            </code>
            .
          </p>

          {/* Terminal-styled SSE example */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-gradient-to-br from-[#0a0a0d] via-[#0a0a0c] to-[#08080a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_-16px_rgba(0,0,0,0.6)] mb-5">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-gradient-to-r from-white/[0.02] to-transparent">
              <span className="flex gap-1.5 mr-3">
                {TRAFFIC.map((t, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full ring-1",
                      t.bg,
                      t.ring
                    )}
                  />
                ))}
              </span>
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                SSE stream format
              </span>
              <MiniCopy
                text={`data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"choices":[{"delta":{"content":"! How"},"index":0}]}

data: {"choices":[{"delta":{"content":" can I"},"index":0}]}

data: {"choices":[{"delta":{"content":" help you today?"},"index":0}]}

data: [DONE]`}
              />
            </div>
            {/* Body */}
            <pre className="p-5 font-mono text-[13px] leading-[1.75] text-white/70 overflow-x-auto">
              <code>
                {`data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"choices":[{"delta":{"content":"! How"},"index":0}]}

data: {"choices":[{"delta":{"content":" can I"},"index":0}]}

data: {"choices":[{"delta":{"content":" help you today?"},"index":0}]}

data: [DONE]`}
              </code>
            </pre>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "Chunk format",
                content: (
                  <>
                    Each{" "}
                    <code className="text-white/55 bg-white/[0.04] px-1 py-0.5 rounded text-[11px]">
                      data:
                    </code>{" "}
                    line is a JSON object with a{" "}
                    <code className="text-white/55 bg-white/[0.04] px-1 py-0.5 rounded text-[11px]">
                      choices
                    </code>{" "}
                    array containing a{" "}
                    <code className="text-white/55 bg-white/[0.04] px-1 py-0.5 rounded text-[11px]">
                      delta
                    </code>{" "}
                    with the partial content.
                  </>
                ),
              },
              {
                title: "Stream end",
                content: (
                  <>
                    The stream terminates with{" "}
                    <code className="text-white/55 bg-white/[0.04] px-1 py-0.5 rounded text-[11px]">
                      data: [DONE]
                    </code>
                    . The server closes the connection after sending this signal.
                  </>
                ),
              },
              {
                title: "Timeout",
                content: (
                  <>
                    Idle connections time out after 30 seconds. Keep the
                    connection active by consuming chunks as they arrive.
                  </>
                ),
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-200"
              >
                <h4 className="text-white/90 font-semibold text-xs mb-1.5">
                  {card.title}
                </h4>
                <p className="text-xs text-white/35 leading-relaxed">
                  {card.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Streaming with JavaScript ── */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(165,180,252,0.6)]" />
            Streaming with JavaScript
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Read the response body as a stream, decode chunks, and parse each
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px] mx-1">
              data:
            </code>
            line into a JSON object. This is the standard approach for building
            chat UIs.
          </p>
          <CodeBlock
            language="javascript"
            code={`const response = await fetch("${BASE_URL}/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": "YOUR_API_KEY",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    stream: true,
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split("\\n").filter(l => l.startsWith("data: "));

  for (const line of lines) {
    const payload = line.slice(6); // remove "data: " prefix
    if (payload === "[DONE]") continue;
    const json = JSON.parse(payload);
    const content = json.choices?.[0]?.delta?.content || "";
    process.stdout.write(content);
  }
}`}
          />
        </div>

        {/* ── Comparison table ── */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(165,180,252,0.6)]" />
            Endpoint comparison
          </h3>
          <div className="space-y-3">
            {COMPARISON.map((row, i) => (
              <div
                key={row.title}
                className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-white/[0.06]">
                    <h4 className="text-xs font-mono text-white/25 uppercase tracking-wider mb-3">
                      {row.title}
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-200/50 mb-1">
                          Unified
                        </div>
                        <code className="block text-sm text-white/80 font-mono">
                          {row.unified}
                        </code>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-200/50 mb-1">
                          OpenAI
                        </div>
                        <code className="block text-sm text-white/80 font-mono">
                          {row.openai}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-5 flex items-center">
                    <p className="text-sm text-white/55 leading-[1.75]">
                      {row.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── OpenAI-compatible endpoint ── */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-white/95 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            OpenAI-compatible endpoint
          </h3>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Yapapa also provides a fully OpenAI-compatible endpoint at{" "}
            <code>/v1/chat/completions</code>. This endpoint accepts the standard
            OpenAI request format and returns responses in OpenAI format, making
            it a drop-in replacement for existing OpenAI integrations.
          </p>
          <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.04] via-white/[0.01] to-transparent p-5 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500/[0.12] to-emerald-600/[0.04] text-emerald-300 text-[11px] font-mono font-bold border border-emerald-500/20 shadow-sm">
                POST
              </span>
              <code className="text-white/75 font-mono text-sm">
                {BASE_URL}/v1/chat/completions
              </code>
            </div>
            <p className="text-sm text-white/55 leading-[1.75]">
              Use this endpoint with the standard OpenAI SDK or any library
              expecting the OpenAI API. Authentication uses the standard{" "}
              <code>Authorization: Bearer</code> header.
            </p>
          </div>
          <CodeBlock
            code={`curl ${BASE_URL}/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '{\n    "model": "openai/gpt-4o",\n    "messages": [{"role": "user", "content": "Hello!"}],\n    "stream": false\n  }'`}
          />
        </div>

        <TipBox variant="info">
          Always use <code>X-Api-Key</code> for the <code>/api/chat</code>{" "}
          endpoint or <code>Authorization: Bearer</code> for the{" "}
          <code>/v1/chat/completions</code> endpoint. For streaming, set{" "}
          <code>stream: true</code> and use <code>curl -N</code> to disable
          output buffering.
        </TipBox>
      </Section>
    </motion.div>
  );
}
