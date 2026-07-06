"use client";

import { motion } from "framer-motion";
import {
  Network,
  ShieldCheck,
  ArrowRightLeft,
  Database,
  Shield,
  Gauge,
  Eye,
  Languages,
  Cpu,
  Activity,
  Zap,
  AlertTriangle,
  Layers,
  ToggleLeft,
  Coins,
} from "lucide-react";
import { Section } from "@/components/docs/Section";
import { DocsSubhead } from "@/components/docs/DocsCard";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { TipBox } from "@/components/docs/TipBox";

const PIPELINE_STAGES = [
  {
    step: "01",
    name: "Validator",
    icon: ShieldCheck,
    desc: "Validates request schema, required fields, and model availability before any processing begins.",
    color: "text-emerald-200",
    bg: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/15",
  },
  {
    step: "02",
    name: "Router",
    icon: ArrowRightLeft,
    desc: "Maps the model string to the correct provider. Supports A/B testing, budget-aware routing, and fallback chains.",
    color: "text-indigo-200",
    bg: "bg-indigo-500/[0.06]",
    border: "border-indigo-500/15",
  },
  {
    step: "03",
    name: "Cache",
    icon: Database,
    desc: "TTL-based and semantic-deduplication cache. Checks Redis for identical or semantically similar requests.",
    color: "text-sky-200",
    bg: "bg-sky-500/[0.06]",
    border: "border-sky-500/15",
  },
  {
    step: "04",
    name: "Guardrails",
    icon: Shield,
    desc: "Content safety checks. Filters harmful content, applies input/output policies, and enforces usage rules.",
    color: "text-amber-200",
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/15",
  },
  {
    step: "05",
    name: "Moderation",
    icon: Eye,
    desc: "Secondary content moderation layer with configurable strictness. Can block or flag content.",
    color: "text-rose-200",
    bg: "bg-rose-500/[0.06]",
    border: "border-rose-500/15",
  },
  {
    step: "06",
    name: "Translator",
    icon: Languages,
    desc: "Converts between OpenAI, Anthropic, and generic formats. Handles message mapping, tool schemas, and streaming protocol differences.",
    color: "text-violet-200",
    bg: "bg-violet-500/[0.06]",
    border: "border-violet-500/15",
  },
  {
    step: "07",
    name: "Provider",
    icon: Cpu,
    desc: "Executes the actual LLM API call. Manages API keys, key rotation, health checks, and provider-specific SDK integrations.",
    color: "text-blue-200",
    bg: "bg-blue-500/[0.06]",
    border: "border-blue-500/15",
  },
  {
    step: "08",
    name: "Telemetry",
    icon: Activity,
    desc: "Records request metadata, latency, token counts, and cost. Feeds the analytics dashboard and billing pipeline.",
    color: "text-teal-200",
    bg: "bg-teal-500/[0.06]",
    border: "border-teal-500/15",
  },
  {
    step: "09",
    name: "Circuit Breaker",
    icon: Zap,
    desc: "Tracks provider failure rates. Opens the circuit after consecutive failures, rerouting to fallback providers.",
    color: "text-orange-200",
    bg: "bg-orange-500/[0.06]",
    border: "border-orange-500/15",
  },
  {
    step: "10",
    name: "Watcher",
    icon: AlertTriangle,
    desc: "Monitors response quality, latency anomalies, and cost spikes. Can trigger alerts and automatic rerouting.",
    color: "text-pink-200",
    bg: "bg-pink-500/[0.06]",
    border: "border-pink-500/15",
  },
];

const PROVIDERS = [
  { name: "OpenAI", prefix: "openai/", sdk: "openai-go/v3", models: "GPT-4o, o3, o4-mini, GPT-4o-mini" },
  { name: "Anthropic", prefix: "anthropic/", sdk: "anthropic-sdk-go", models: "Claude Sonnet 4, Claude 3.7 Sonnet, Claude 3 Opus" },
  { name: "Google Gemini", prefix: "gemini/", sdk: "REST API", models: "Gemini 2.5 Pro, Gemini 2.0 Flash" },
  { name: "Groq", prefix: "groq/", sdk: "openai-compat", models: "Llama 3, Mixtral, Gemma 2" },
  { name: "NVIDIA NIM", prefix: "nvidia/", sdk: "REST API", models: "Nemotron, Llama 3.1 NIM" },
  { name: "Mistral", prefix: "mistral/", sdk: "openai-compat", models: "Mistral Large, Mistral Small" },
  { name: "DeepSeek", prefix: "deepseek/", sdk: "openai-compat", models: "DeepSeek V3, DeepSeek R1" },
  { name: "Meta", prefix: "meta/", sdk: "via provider", models: "Llama 3.1, Llama 3.2" },
];

export default function GatewayPage() {
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
        id="gateway"
        icon={Network}
        eyebrow="Architecture"
        title="LLM Gateway"
        italic="Pipeline"
        description="Yapapa's LLM Gateway processes every request through a 10-stage pipeline. Each stage is independently testable and configurable. The pipeline handles routing, caching, safety, translation, provider execution, and observability."
      >
        {/* Pipeline stages */}
        <div className="mt-8">
          <DocsSubhead>Pipeline stages</DocsSubhead>
          <div className="space-y-2">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.step}
                className={`flex items-start gap-4 p-4 rounded-xl border ${stage.border} ${stage.bg} transition-all duration-200 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)]`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg border ${stage.border} ${stage.bg} flex items-center justify-center`}>
                  <span className="text-[10px] font-mono font-bold text-white/50">{stage.step}</span>
                </div>
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl border ${stage.border} ${stage.bg} flex items-center justify-center`}>
                  <stage.icon className={`w-4 h-4 ${stage.color}`} />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-[13px] font-semibold ${stage.color} mb-1`}>
                    {stage.name}
                  </h4>
                  <p className="text-xs text-white/45 leading-[1.6]">
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider registry */}
        <div className="mt-14">
          <DocsSubhead>
            Provider registry
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The gateway maintains a dynamic provider registry. Each provider has its own API key pool,
            health status, and configuration. Providers are registered at startup and can be added or
            updated at runtime through the admin API.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="text-left py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">
                    Prefix
                  </th>
                  <th className="text-left py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">
                    SDK
                  </th>
                  <th className="text-left py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">
                    Key Models
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {PROVIDERS.map((p) => (
                  <tr key={p.name} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{p.name}</td>
                    <td className="py-3 px-4">
                      <code className="text-indigo-200/80 font-mono text-xs">{p.prefix}</code>
                    </td>
                    <td className="py-3 px-4 text-white/40 font-mono text-xs">{p.sdk}</td>
                    <td className="py-3 px-4 text-white/30 text-xs">{p.models}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Routing strategies */}
        <div className="mt-14">
          <DocsSubhead>
            Routing strategies
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The router stage supports multiple strategies for mapping model requests to providers.
            Configure routing groups via the admin settings or environment variables.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: ArrowRightLeft,
                title: "Model-based routing",
                desc: "The default strategy. The provider/ prefix in the model string determines which provider handles the request. Change the model string, change the provider.",
              },
              {
                icon: Coins,
                title: "Budget-aware routing",
                desc: "Routes to the cheapest provider that supports the requested model. Compares per-token costs across providers and selects the most cost-effective option.",
              },
              {
                icon: Layers,
                title: "A/B testing",
                desc: "Split traffic between providers or model versions. Define routing groups with percentage weights to compare quality, latency, or cost.",
              },
              {
                icon: Zap,
                title: "Fallback chains",
                desc: "Define ordered fallback providers. If the primary provider fails or the circuit breaker opens, the request is automatically rerouted to the next provider in the chain.",
              },
            ].map((strategy) => (
              <div
                key={strategy.title}
                className="p-5 rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent hover:border-indigo-500/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center">
                    <strategy.icon className="w-4 h-4 text-indigo-200" />
                  </div>
                  <h4 className="text-[13px] font-semibold text-white/85">{strategy.title}</h4>
                </div>
                <p className="text-xs text-white/40 leading-[1.6]">{strategy.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Circuit breaker */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
            Circuit breaker
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Each provider has an independent circuit breaker that tracks failure rates.
            When a provider exceeds the failure threshold, the circuit opens and requests
            are rerouted to fallback providers. The circuit automatically transitions
            through three states:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                state: "Closed",
                desc: "Normal operation. All requests flow to the provider. Failures are tracked.",
                color: "text-emerald-200",
                bg: "bg-emerald-500/[0.06]",
                border: "border-emerald-500/15",
              },
              {
                state: "Open",
                desc: "Provider is unhealthy. Requests are immediately rerouted. No calls are made to the provider.",
                color: "text-rose-200",
                bg: "bg-rose-500/[0.06]",
                border: "border-rose-500/15",
              },
              {
                state: "Half-Open",
                desc: "Testing recovery. A limited number of requests are sent to check if the provider has recovered.",
                color: "text-amber-200",
                bg: "bg-amber-500/[0.06]",
                border: "border-amber-500/15",
              },
            ].map((s) => (
              <div
                key={s.state}
                className={`p-5 rounded-xl border ${s.border} ${s.bg}`}
              >
                <h4 className={`text-[13px] font-semibold ${s.color} mb-2`}>{s.state}</h4>
                <p className="text-xs text-white/45 leading-[1.6]">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/35 mt-4">
            Monitor circuit breaker states via{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/60 font-mono text-[11px]">
              GET /api/admin/circuit-breakers
            </code>{" "}
            in the admin API.
          </p>
        </div>

        {/* Caching */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            Response caching
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The cache stage reduces cost and latency by serving previously computed responses.
            Two caching strategies are available, both backed by Redis when configured.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: "TTL Cache",
                desc: "Standard key-value cache with configurable time-to-live. Uses a hash of the request body as the cache key. Identical requests within the TTL window receive cached responses instantly.",
              },
              {
                title: "Semantic Dedup",
                desc: "Uses embedding similarity to detect semantically equivalent requests. Two prompts with different wording but the same intent can hit the same cache entry, dramatically improving cache hit rates.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="p-5 rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent"
              >
                <h4 className="text-[13px] font-semibold text-sky-200 mb-2">{c.title}</h4>
                <p className="text-xs text-white/45 leading-[1.6]">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Translator */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Format translation
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The translator stage converts between provider-specific formats so you can use
            any model through a single API shape. It handles message mapping, tool schema
            conversion, streaming protocol differences, and image content normalization.
          </p>
          <CodeBlock
            language="json"
            code={`// Input: OpenAI format → Output: Anthropic format
// You send:
{ "model": "anthropic/claude-sonnet-4", "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "Hello!" }
]}

// Gateway translates to Anthropic format internally:
{ "model": "claude-sonnet-4", "system": "You are helpful.",
  "messages": [{ "role": "user", "content": "Hello!" }]}`}
          />
        </div>

        <TipBox variant="info">
          The pipeline is orchestrated by{" "}
          <code className="text-indigo-200/80">pkg/llm/pipeline/pipeline.go</code>.
          Each stage is a Go interface with a single{" "}
          <code className="text-indigo-200/80">Process()</code> method.
          You can add custom stages by implementing the interface and registering
          it in the pipeline factory.
        </TipBox>
      </Section>
    </motion.div>
  );
}
