"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Zap,
  Key,
  Code2,
  MessageSquare,
  Database,
  Boxes,
  FileText,
  Layers,
  UploadCloud,
  Shield,
  AlertTriangle,
  Cpu,
  TrendingUp,
  BarChart3,
  Lock,
  Terminal,
  ArrowRight,
  ArrowUpRight,
  Users,
  Webhook,
  Globe,
  BookOpen,
  Sparkles,
  Command,
  Clock,
  Activity,
  Search,
  Rocket,
  Building2,
  Newspaper,
} from "lucide-react";
import type { NavItem } from "@/components/docs/types";
import { cn } from "@/lib/utils";
import { DocsRouteRow, DocsCard, DocsIconTile } from "@/components/docs/DocsCard";

interface DocSection extends NavItem {
  desc: string;
  category: string;
  href: string;
  wire?: boolean; // represents the response / return side of a request
}

const sections: DocSection[] = [
  {
    id: "quickstart",
    label: "Quick Start",
    icon: Zap,
    desc: "Get up and running in under 5 minutes.",
    category: "Getting Started",
    href: "/docs/quickstart",
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: Key,
    desc: "API keys, JWT, and bearer token auth.",
    category: "Getting Started",
    href: "/docs/authentication",
  },
  {
    id: "api-reference",
    label: "API Reference",
    icon: Code2,
    desc: "Complete endpoint documentation.",
    category: "Getting Started",
    href: "/docs/api-reference",
  },
  {
    id: "sdk",
    label: "SDK Reference",
    icon: BookOpen,
    desc: "TypeScript SDK, Go SDK, and React Query hooks.",
    category: "Getting Started",
    href: "/docs/sdk",
  },
  {
    id: "self-hosting",
    label: "Self-Hosting",
    icon: Globe,
    desc: "Configure base URL for your deployment.",
    category: "Getting Started",
    href: "/docs/self-hosting",
  },
  {
    id: "chat",
    label: "Chat & Streaming",
    icon: MessageSquare,
    desc: "SSE streaming and standard chat.",
    category: "Core Features",
    href: "/docs/chat",
    wire: true,
  },
  {
    id: "anthropic",
    label: "Anthropic Messages",
    icon: MessageSquare,
    desc: "Full Anthropic Messages API compatibility.",
    category: "Core Features",
    href: "/docs/anthropic",
  },
  {
    id: "embeddings",
    label: "Embeddings",
    icon: Database,
    desc: "Generate text embeddings.",
    category: "Core Features",
    href: "/docs/embeddings",
    wire: true,
  },
  {
    id: "conversations",
    label: "Conversations",
    icon: Boxes,
    desc: "Multi-turn conversation management.",
    category: "Core Features",
    href: "/docs/conversations",
  },
  {
    id: "prompts",
    label: "Prompt Templates",
    icon: FileText,
    desc: "Reusable prompt templates.",
    category: "Core Features",
    href: "/docs/prompts",
  },
  {
    id: "function-calling",
    label: "Function Calling",
    icon: Terminal,
    desc: "Tool use and structured outputs.",
    category: "Core Features",
    href: "/docs/function-calling",
    wire: true,
  },
  {
    id: "gateway",
    label: "LLM Gateway",
    icon: Cpu,
    desc: "10-stage pipeline, routing, and circuit breaker.",
    category: "Platform",
    href: "/docs/gateway",
  },
  {
    id: "batch",
    label: "Batch API",
    icon: Layers,
    desc: "Process multiple requests at once.",
    category: "Platform",
    href: "/docs/batch",
  },
  {
    id: "files",
    label: "File Upload",
    icon: UploadCloud,
    desc: "Upload images for vision models.",
    category: "Platform",
    href: "/docs/files",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    icon: Webhook,
    desc: "Event-driven outbound delivery.",
    category: "Platform",
    href: "/docs/webhooks",
    wire: true,
  },
  {
    id: "rate-limits",
    label: "Rate Limits",
    icon: Shield,
    desc: "Usage limits and throttling.",
    category: "Platform",
    href: "/docs/rate-limits",
  },
  {
    id: "error-handling",
    label: "Error Handling",
    icon: AlertTriangle,
    desc: "Error codes and responses.",
    category: "Platform",
    href: "/docs/error-handling",
  },
  {
    id: "organizations",
    label: "Organizations",
    icon: Users,
    desc: "Multi-user organization management.",
    category: "Platform",
    href: "/docs/organizations",
  },
  {
    id: "models",
    label: "Available Models",
    icon: Cpu,
    desc: "Supported providers and models.",
    category: "Reference",
    href: "/docs/models",
  },
  {
    id: "pricing",
    label: "Pricing & Credits",
    icon: TrendingUp,
    desc: "Credit system and costs.",
    category: "Reference",
    href: "/docs/pricing",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    desc: "Usage analytics and monitoring.",
    category: "Reference",
    href: "/docs/dashboard",
  },
  {
    id: "admin",
    label: "Admin API",
    icon: Lock,
    desc: "Platform management and RBAC.",
    category: "Reference",
    href: "/docs/admin",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    desc: "Encryption, hashing, and CORS.",
    category: "Reference",
    href: "/docs/security",
  },
  {
    id: "examples",
    label: "Code Examples",
    icon: Terminal,
    desc: "Full examples in Python, JS, Go.",
    category: "Reference",
    href: "/docs/examples",
  },
];

const categories = ["Getting Started", "Core Features", "Platform", "Reference"] as const;

/* A short tagline per category that delivers the gateway vocabulary. */
const categoryTaglines: Record<string, string> = {
  "Getting Started": "the route in",
  "Core Features": "the request & its return",
  Platform: "the machinery behind the gateway",
  Reference: "the map of the territory",
};

const resourceLinks = [
  {
    label: "Changelog",
    desc: "Every release, every fix, every breaking change.",
    icon: FileText,
    href: "/changelog",
  },
  {
    label: "Blog",
    desc: "Engineering deep dives and product decisions.",
    icon: Newspaper,
    href: "/blog",
  },
  {
    label: "Status",
    desc: "Live system availability and recent incidents.",
    icon: Activity,
    href: "/status",
  },
  {
    label: "Roadmap",
    desc: "What we’re building next, and what we’re exploring.",
    icon: Rocket,
    href: "/roadmap",
  },
  {
    label: "Enterprise",
    desc: "Dedicated clusters, SOC 2, BAA, 24/7 support.",
    icon: Building2,
    href: "/enterprise",
  },
  {
    label: "About",
    desc: "Our story, team, investors, and open roles.",
    icon: Users,
    href: "/about",
  },
];

/* Providers the gateway routes to — drives the interactive router. */
const PROVIDERS = [
  { id: "openai", label: "gpt-4o", vendor: "OpenAI" },
  { id: "anthropic", label: "claude-4-sonnet", vendor: "Anthropic" },
  { id: "google", label: "gemini-2.5-pro", vendor: "Google" },
  { id: "groq", label: "llama-4-scout", vendor: "Groq" },
  { id: "nvidia", label: "deepseek-r1", vendor: "NVIDIA NIM" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.08 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ── Interactive provider router — the page's signature element ──
   A literal diagram of one request being routed to many providers.
   Click a provider: the signal line (indigo→cyan) animates to that
   branch and the `{model}` token updates live. Reduced-motion users
   get a static diagram with the active branch pre-lit. */
function ProviderRouter() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const activeId = PROVIDERS[active].id;
  const activeLabel = PROVIDERS[active].label;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "border border-white/[0.07] bg-gradient-to-br from-white/[0.025] via-white/[0.008] to-transparent",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_24px_80px_-32px_rgba(0,0,0,0.7)]",
      )}
    >
      {/* top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />
      {/* faint static wash (replaces the breathing orbs) */}
      <div
        className="absolute inset-0 opacity-[0.5] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 20% 0%, rgba(99,102,241,0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(34,211,238,0.06), transparent 70%)",
        }}
      />

      <div className="relative p-6 sm:p-8">
        {/* request line */}
        <div className="flex items-center gap-2 mb-6 font-mono text-[11px] sm:text-xs">
          <span className="px-2 py-0.5 rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200/90 tracking-[0.06em]">
            POST
          </span>
          <span className="text-white/45">/v1/chat/completions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-y-6 sm:gap-6 items-center">
          {/* CALL (left) */}
          <div className="relative rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
              your call
            </span>
            <pre className="mt-2 font-mono text-[12px] sm:text-[13px] leading-relaxed text-white/65 overflow-x-auto">
              <span className="text-amber-200/90">{`"messages"`}</span>
              {": [ … ],\n"}
              <span className="text-amber-200/90">{`"stream"`}</span>
              {": "}
              <span className="text-violet-300">true</span>
              {",\n"}
              <span className="text-amber-200/90">{`"model"`}</span>
              {": "}
              <span className="text-cyan-300">{`"${activeLabel}"`}</span>
            </pre>
          </div>

          {/* GATEWAY (center) */}
          <div className="relative flex flex-col items-center justify-center sm:px-2">
            <div className="relative w-16 h-16 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/12 to-transparent flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_28px_-6px_rgba(99,102,241,0.5)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              {/* spinning route ring, paused when reduced motion */}
              <motion.div
                className="absolute inset-0 rounded-2xl border border-cyan-300/20"
                animate={reduced ? {} : { rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                style={{ borderStyle: "dashed" }}
              />
              <span className="font-mono text-xl text-indigo-200 relative z-10">⊙</span>
            </div>
            <span className="mt-2 text-[9px] font-mono uppercase tracking-[0.2em] text-indigo-200/70">
              gateway
            </span>
            <span className="text-[9px] font-mono text-white/25 mt-0.5">10-stage route</span>
          </div>

          {/* PROVIDERS (right) */}
          <div className="relative">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 mb-2 block">
              routed to · 100+ models
            </span>
            <div className="flex flex-col gap-1.5">
              {PROVIDERS.map((p, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    className="docs-route group relative flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg border bg-white/[0.015] transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: isActive ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.06)",
                      background: isActive
                        ? "linear-gradient(to right, rgba(34,211,238,0.08), rgba(34,211,238,0.01))"
                        : undefined,
                    }}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all",
                        isActive ? "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" : "bg-white/20",
                      )}
                    />
                    <span
                      className={cn(
                        "font-mono text-[12px] tracking-[-0.01em] transition-colors",
                        isActive ? "text-cyan-100" : "text-white/55 group-hover:text-white/85",
                      )}
                    >
                      {p.label}
                    </span>
                    <span
                      className={cn(
                        "ml-auto text-[9px] font-mono uppercase tracking-[0.12em] transition-colors",
                        isActive ? "text-cyan-200/80" : "text-white/20",
                      )}
                    >
                      {p.vendor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11.5px] text-white/35 leading-relaxed">
          One OpenAI-compatible request. Swap the{" "}
          <code className="px-1 py-0.5 rounded bg-white/[0.05] text-cyan-200/90 font-mono text-[11px]">
            model
          </code>{" "}
          string to switch providers — no client refactor.
        </p>
      </div>
    </div>
  );
}

/* ── Section heading for a category ── */
function CategoryHeader({
  index,
  category,
  count,
}: {
  index: number;
  category: string;
  count: number;
}) {
  return (
    <header className="flex items-baseline gap-3 mb-5">
      <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-indigo-200/45">
        §{String(index + 1).padStart(2, "0")}
      </span>
      <h2 className="text-[18px] sm:text-[22px] font-semibold tracking-[-0.025em] text-white">
        {category}
      </h2>
      <span className="font-display italic font-normal text-indigo-200/80 text-[15px] sm:text-[17px] -ml-1">
        — {categoryTaglines[category]}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/15 via-white/[0.05] to-transparent" />
      <span className="font-mono text-[9px] tabular-nums tracking-[0.15em] text-white/25">
        {String(count).padStart(2, "0")} ROUTES
      </span>
    </header>
  );
}

export default function DocsIndexPage() {
  return (
    <div className="relative">
      {/* ═══════════════════════════════════════════
          GATEWAY HERO
          ═══════════════════════════════════════════ */}
      <section className="relative mb-24 sm:mb-28 pt-4 sm:pt-8">
        <div className="relative z-10">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center gap-3 mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.8)]" />
            </span>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">
              Documentation
            </span>
            <div className="h-px w-12 bg-gradient-to-r from-white/[0.1] to-transparent" />
            <span className="text-[10px] font-mono text-white/25 tracking-[0.2em]">v1.0</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-[2.5rem] sm:text-[3.4rem] lg:text-[4.5rem] font-semibold tracking-[-0.04em] leading-[0.96] mb-6"
          >
            <span className="text-white/95">One request,</span>{" "}
            <span className="font-display italic font-normal bg-clip-text text-transparent bg-gradient-to-br from-indigo-200 via-violet-200 to-cyan-200">
              many providers
            </span>
            <span className="text-white/40">.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-[15px] sm:text-[17px] text-white/45 max-w-xl leading-[1.7] mb-8"
          >
            A universal LLM gateway: an OpenAI-compatible API that routes to
            100+ models, with credit-based billing, real-time analytics, and
            full conversation control. This is the map of every route through it.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-wrap items-center gap-3 mb-12"
          >
            <Link
              href="/docs/quickstart"
              className={cn(
                "group flex items-center gap-2 px-5 py-2.5 rounded-xl",
                "bg-gradient-to-br from-indigo-500/20 via-indigo-500/12 to-violet-500/10",
                "border border-indigo-500/25",
                "text-[13px] font-medium text-white/85 hover:text-white",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(99,102,241,0.4)]",
                "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_32px_-8px_rgba(99,102,241,0.55)]",
                "hover:border-indigo-400/40",
                "transition-all duration-300 relative overflow-hidden",
              )}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <Zap className="w-3.5 h-3.5 text-indigo-200" />
              Get Started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button
              type="button"
              onClick={() => {
                const e = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(e);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer",
                "border border-white/[0.07] bg-white/[0.02]",
                "text-[13px] font-medium text-white/45 hover:text-white/75",
                "hover:border-indigo-500/20 hover:bg-indigo-500/[0.04]",
                "transition-all duration-300",
              )}
            >
              <Search className="w-3.5 h-3.5" />
              Search docs
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-[2px] rounded-[4px] bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono text-white/30 leading-none ml-1">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
            <Link
              href="/docs/api-reference"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white/35 hover:text-white/65 transition-colors duration-300"
            >
              API Reference
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Live status rail */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-12 text-[11px] font-mono text-white/30"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400/80" />
              <span>All systems operational</span>
            </span>
            <span className="text-white/10">·</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-200/70" />
              <span>100+ models available</span>
            </span>
            <span className="text-white/10">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-200/70" />
              <span>Last updated 2 days ago</span>
            </span>
          </motion.div>

          {/* The router — signature element */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProviderRouter />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORY ROUTES — a routing table, not a card grid
          ═══════════════════════════════════════════ */}
      {categories.map((category, catIdx) => {
        const catSections = sections.filter((s) => s.category === category);
        const catCount = catSections.length;

        return (
          <motion.section
            key={category}
            id={`cat-${category.toLowerCase().replace(/\s+/g, "-")}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.03, delayChildren: catIdx * 0.03 },
              },
            }}
            className="relative mb-20 sm:mb-24 last:mb-8 scroll-mt-24"
          >
            <CategoryHeader index={catIdx} category={category} count={catCount} />

            {/* row list — hairline-separated, not boxed */}
            <div className="relative rounded-2xl border border-white/[0.05] bg-white/[0.012] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-50" />
              <div className="divide-y divide-white/[0.04]">
                {catSections.map((section, idx) => (
                  <motion.div key={section.id} variants={fadeUp} custom={idx}>
                    <DocsRouteRow
                      id={section.id}
                      label={section.label}
                      desc={section.desc}
                      href={section.href}
                      wire={section.wire}
                    />
                  </motion.div>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40" />
            </div>
          </motion.section>
        );
      })}

      {/* ═══════════════════════════════════════════
          MORE FROM YAPAPA
          ═══════════════════════════════════════════ */}
      <section className="relative mb-16 sm:mb-20 scroll-mt-24">
        <header className="flex items-baseline gap-3 mb-5">
          <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-indigo-200/45">
            §{(categories.length + 1).toString().padStart(2, "0")}
          </span>
          <h2 className="text-[18px] sm:text-[22px] font-semibold tracking-[-0.025em] text-white">
            More from{" "}
            <span className="font-display italic font-normal text-indigo-200/95">Yapapa</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/15 via-white/[0.05] to-transparent" />
          <span className="text-[9px] font-mono text-white/30 tabular-nums tracking-[0.15em]">
            {resourceLinks.length} PAGES
          </span>
        </header>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
        >
          {resourceLinks.map((res, idx) => (
            <motion.div key={res.href} variants={fadeUp} custom={idx}>
              <DocsCard interactive className="h-full">
                <Link
                  href={res.href}
                  className="group relative block p-5 cursor-pointer h-full"
                >
                  <div className="relative flex items-start gap-3.5">
                    <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)", filter: "blur(36px)" }} />
                    <DocsIconTile icon={res.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-white/70 group-hover:text-white transition-colors tracking-[-0.01em] flex items-center gap-1.5">
                        {res.label}
                        <ArrowUpRight className="w-3 h-3 text-white/0 group-hover:text-indigo-200 transition-all duration-200" />
                      </p>
                      <p className="text-[11.5px] text-white/35 mt-1 leading-[1.6] group-hover:text-white/50 transition-colors">
                        {res.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              </DocsCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER CTA
          ═══════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-16 mb-4 rounded-2xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.08] via-violet-500/[0.04] to-transparent p-8 sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/[0.12] blur-3xl pointer-events-none" />
        <div className="relative">
          <h3 className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.03em] text-white mb-3">
            Ready to ship{" "}
            <span className="font-display italic font-normal text-indigo-200/95">faster</span>?
          </h3>
          <p className="text-[14px] text-white/55 max-w-md leading-[1.7] mb-6">
            Open the playground to test prompts against any model in your
            browser, or grab a key and make your first call in 30 seconds.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/playground"
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl",
                "bg-white/[0.06] border border-white/[0.1] text-[13px] font-medium text-white/85",
                "hover:bg-white/[0.1] hover:border-white/[0.18] hover:text-white",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
                "transition-all duration-300",
              )}
            >
              Open Playground
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/docs/quickstart"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white/55 hover:text-white transition-colors"
            >
              Read the Quick Start
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
