"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  UserPlus,
  KeyRound,
  Code2,
  Rocket,
  ArrowRight,
  Copy,
  Check,
  BookOpen,
  Activity,
  Clock,
  ShieldCheck,
  Database,
  Users,
  ListChecks,
  FileX,
  Sparkles,
  Terminal,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════
   Section 02 — Zero to Production
   Asymmetric bento: sticky scroll-spy tracker, per-step micro-viz,
   trust strip, dual-action CTA. AAA contrast, reduced-motion safe.
   ═══════════════════════════════════════════════════════════════════ */

const ACCENT = {
  hex: "#6366f1",
  hexSoft: "#a5b4fc",
  statusHex: "#10b981",
  statusHexSoft: "#6ee7b7",
  glow: "rgba(99,102,241,0.35)",
  ringGlow: "0 0 0 1px rgba(99,102,241,0.4), 0 0 24px rgba(99,102,241,0.25)",
};

type StepId = "01" | "02" | "03" | "04";
type MicroVizKind = "live-signup" | "key-reveal" | "code-tabs" | "mini-dash";

interface Step {
  id: StepId;
  title: string;
  italic: string;
  desc: string;
  duration: string;
  icon: typeof UserPlus;
  micro: MicroVizKind;
}

const STIData: StepId[] = ["01", "02", "03", "04"];
const STEPS: ReadonlyArray<Step> = [
  {
    id: "01",
    title: "Create",
    italic: "account",
    desc: "Email or OAuth. Zero friction, no card, no approval queue — start coding in under fifteen seconds.",
    duration: "15s",
    icon: UserPlus,
    micro: "live-signup",
  },
  {
    id: "02",
    title: "Provision",
    italic: "your key",
    desc: "Generate credentials from the dashboard. Instant, named, scoped to your workspace — no waiting room.",
    duration: "instant",
    icon: KeyRound,
    micro: "key-reveal",
  },
  {
    id: "03",
    title: "Connect",
    italic: "the SDK",
    desc: "Drop-in replacement for OpenAI. Change one line, unlock 100+ models — TypeScript, Python, or cURL.",
    duration: "5 min",
    icon: Code2,
    micro: "code-tabs",
  },
  {
    id: "04",
    title: "Ship",
    italic: "to production",
    desc: "Monitor usage, set budgets, optimize cost — all from one pane of glass, with sub-50ms p95.",
    duration: "continuous",
    icon: Rocket,
    micro: "mini-dash",
  },
];

const TRUST_METRICS: ReadonlyArray<{
  label: string;
  value: string;
  icon: typeof Activity;
}> = [
  { label: "Requests / min", value: "8.4M", icon: Activity },
  { label: "p50 latency", value: "12ms", icon: Clock },
  { label: "Uptime", value: "99.99%", icon: ShieldCheck },
  { label: "Models", value: "100+", icon: Database },
  { label: "Engineers", value: "12.4k", icon: Users },
];

/* ── Key stats for the header — visual reinforcement of
 * "four steps, under ten minutes, zero paperwork" ── */
const KEY_STAT_ACCENTS: Record<
  "indigo" | "emerald" | "violet",
  { color: string; glow: string; bg: string }
> = {
  indigo: {
    color: "#a5b4fc",
    glow: "rgba(129,140,248,0.5)",
    bg: "rgba(99,102,241,0.12)",
  },
  emerald: {
    color: "#6ee7b7",
    glow: "rgba(110,231,183,0.5)",
    bg: "rgba(16,185,129,0.12)",
  },
  violet: {
    color: "#c4b5fd",
    glow: "rgba(196,181,253,0.5)",
    bg: "rgba(139,92,246,0.12)",
  },
};

const KEY_STATS: ReadonlyArray<{
  label: string;
  value: string;
  icon: typeof ListChecks;
  accent: "indigo" | "emerald" | "violet";
}> = [
  { label: "Four steps", value: "4", icon: ListChecks, accent: "indigo" },
  { label: "Under ten min", value: "<10m", icon: Clock, accent: "emerald" },
  { label: "Zero paperwork", value: "0", icon: FileX, accent: "violet" },
];

type TokenType = "kw" | "id" | "str" | "punct" | "t" | "fn";
interface Token {
  type: TokenType;
  text: string;
}

const TOKEN_STYLES: Record<TokenType, string> = {
  kw: "text-indigo-300",
  id: "text-white/85",
  str: "text-amber-300/95",
  punct: "text-white/30",
  t: "text-white/55",
  fn: "text-emerald-300",
};

type Lang = "ts" | "py" | "curl";

const CODE_BY_LANG: Record<Lang, { tokens: Token[] }[]> = {
  ts: [
    {
      tokens: [
        { type: "kw", text: "import" },
        { type: "t", text: " " },
        { type: "id", text: "OpenAI" },
        { type: "t", text: " " },
        { type: "kw", text: "from" },
        { type: "t", text: " " },
        { type: "str", text: '"openai"' },
        { type: "punct", text: ";" },
      ],
    },
    { tokens: [{ type: "t", text: "" }] },
    {
      tokens: [
        { type: "kw", text: "const" },
        { type: "t", text: " " },
        { type: "id", text: "client" },
        { type: "t", text: " = " },
        { type: "kw", text: "new" },
        { type: "t", text: " " },
        { type: "id", text: "OpenAI" },
        { type: "punct", text: "({" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "id", text: "apiKey" },
        { type: "punct", text: ":" },
        { type: "t", text: " " },
        { type: "id", text: "process" },
        { type: "punct", text: "." },
        { type: "id", text: "env" },
        { type: "punct", text: "." },
        { type: "id", text: "YAPAPA_KEY" },
        { type: "punct", text: "," },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "id", text: "baseURL" },
        { type: "punct", text: ":" },
        { type: "t", text: " " },
        { type: "str", text: '"https://api.yapa.up.railway.app/v1"' },
        { type: "punct", text: "," },
      ],
    },
    { tokens: [{ type: "punct", text: "});" }] },
    { tokens: [{ type: "t", text: "" }] },
    {
      tokens: [
        { type: "kw", text: "const" },
        { type: "t", text: " " },
        { type: "id", text: "r" },
        { type: "t", text: " = " },
        { type: "kw", text: "await" },
        { type: "t", text: " " },
        { type: "id", text: "client" },
        { type: "punct", text: "." },
        { type: "fn", text: "chat" },
        { type: "punct", text: "." },
        { type: "fn", text: "completions" },
        { type: "punct", text: "." },
        { type: "fn", text: "create" },
        { type: "punct", text: "({" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "id", text: "model" },
        { type: "punct", text: ":" },
        { type: "t", text: " " },
        { type: "str", text: '"auto"' },
        { type: "punct", text: "," },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "id", text: "messages" },
        { type: "punct", text: ":" },
        { type: "t", text: " [{ " },
        { type: "id", text: "role" },
        { type: "punct", text: ":" },
        { type: "t", text: " " },
        { type: "str", text: '"user"' },
        { type: "punct", text: ", " },
        { type: "id", text: "content" },
        { type: "punct", text: ":" },
        { type: "t", text: " " },
        { type: "str", text: '"Ship it."' },
        { type: "t", text: " }]," },
      ],
    },
    { tokens: [{ type: "punct", text: "});" }] },
  ],
  py: [
    {
      tokens: [
        { type: "kw", text: "from" },
        { type: "t", text: " " },
        { type: "id", text: "openai" },
        { type: "t", text: " " },
        { type: "kw", text: "import" },
        { type: "t", text: " " },
        { type: "id", text: "OpenAI" },
      ],
    },
    { tokens: [{ type: "t", text: "" }] },
    {
      tokens: [
        { type: "id", text: "client" },
        { type: "t", text: " = " },
        { type: "id", text: "OpenAI" },
        { type: "punct", text: "(" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "    " },
        { type: "id", text: "api_key" },
        { type: "punct", text: "=" },
        { type: "id", text: "os" },
        { type: "punct", text: "." },
        { type: "id", text: "environ" },
        { type: "punct", text: "[" },
        { type: "str", text: '"YAPAPA_KEY"' },
        { type: "punct", text: "]," },
      ],
    },
    {
      tokens: [
        { type: "t", text: "    " },
        { type: "id", text: "base_url" },
        { type: "punct", text: "=" },
        { type: "str", text: '"https://api.yapa.up.railway.app/v1"' },
        { type: "punct", text: "," },
      ],
    },
    { tokens: [{ type: "punct", text: ")" }] },
    { tokens: [{ type: "t", text: "" }] },
    {
      tokens: [
        { type: "id", text: "r" },
        { type: "t", text: " = " },
        { type: "id", text: "client" },
        { type: "punct", text: "." },
        { type: "fn", text: "chat" },
        { type: "punct", text: "." },
        { type: "fn", text: "completions" },
        { type: "punct", text: "." },
        { type: "fn", text: "create" },
        { type: "punct", text: "(" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "    " },
        { type: "id", text: "model" },
        { type: "punct", text: "=" },
        { type: "str", text: '"auto"' },
        { type: "punct", text: "," },
      ],
    },
    {
      tokens: [
        { type: "t", text: "    " },
        { type: "id", text: "messages" },
        { type: "punct", text: "=[{" },
        { type: "id", text: "role" },
        { type: "punct", text: ":" },
        { type: "str", text: '"user"' },
        { type: "punct", text: ", " },
        { type: "id", text: "content" },
        { type: "punct", text: ":" },
        { type: "str", text: '"Ship it."' },
        { type: "punct", text: "}]," },
      ],
    },
    { tokens: [{ type: "punct", text: ")" }] },
  ],
  curl: [
    {
      tokens: [
        { type: "fn", text: "curl" },
        { type: "t", text: " " },
        { type: "punct", text: "-X" },
        { type: "t", text: " " },
        { type: "str", text: "POST" },
        { type: "t", text: " " },
        {
          type: "str",
          text: '"https://api.yapa.up.railway.app/v1/chat/completions"',
        },
        { type: "t", text: " \\" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "punct", text: "-H" },
        { type: "t", text: " " },
        { type: "str", text: '"Authorization: Bearer $YAPAPA_KEY"' },
        { type: "t", text: " \\" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "punct", text: "-H" },
        { type: "t", text: " " },
        { type: "str", text: '"Content-Type: application/json"' },
        { type: "t", text: " \\" },
      ],
    },
    {
      tokens: [
        { type: "t", text: "  " },
        { type: "punct", text: "-d" },
        { type: "t", text: " " },
        {
          type: "str",
          text: `'{"model":"auto","messages":[{"role":"user","content":"Ship it."}]}'`,
        },
      ],
    },
  ],
};

const LANG_META: Record<Lang, { label: string; file: string }> = {
  ts: { label: "TypeScript", file: "client.ts" },
  py: { label: "Python", file: "client.py" },
  curl: { label: "cURL", file: "request.sh" },
};

/* ── Hooks ── */

function useCopy() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );
  const copy = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // best-effort
    }
  }, []);
  return { copied, copy };
}

/* Pauses JS-driven timers when the tab/document is hidden — avoids burning
 * CPU in the background and keeps the live micro-vizzes feeling brisk. */

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

/* ── Glass card primitive ── */

function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent",
        "border border-white/[0.08]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_30px_60px_-20px_rgba(0,0,0,0.5),0_0_80px_-30px_rgba(99,102,241,0.15)]",
        "contain-[layout_paint_style]",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}

/* ── Atmospheric background ── */

function AtmosphericBackground() {
  // Ambient drift runs as CSS animations on the compositor thread (transform/
  // opacity only), not Framer Motion JS-driven RAF loops. Big re-render win
  // when the section is tall and several of these used to run together.
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <style>{`
        @keyframes s02-drift-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,0,0) scale(1.06); } }
        @keyframes s02-drift-b { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(0,-32px,0) scale(1.08); } }
        @keyframes s02-drift-c { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .s02-drift-a { animation: s02-drift-a 24s ease-in-out infinite; will-change: transform; }
        .s02-drift-b { animation: s02-drift-b 28s ease-in-out infinite; will-change: transform; }
        .s02-drift-c { animation: s02-drift-c 32s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .s02-drift-a, .s02-drift-b, .s02-drift-c { animation: none !important; }
        }
      `}</style>
      <div
        className="s02-drift-a absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="s02-drift-b absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="s02-drift-c absolute bottom-0 left-[58%] w-[600px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 65%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ── Animated count-up hook (motion-safe) ── */

function useCountUp(target: number, active: boolean, durationMs = 1400) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setVal(target);
      return;
    }
    if (startedRef.current) {
      setVal(target);
      return;
    }
    startedRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, reduced, durationMs]);
  return val;
}

/* ── Tiny inline sparkline ── */

function Sparkline({
  data,
  color,
  className,
  width = 64,
  height = 22,
}: {
  data: number[];
  color: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = Math.max(1, max - min);
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const gid = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={`url(#${gid})`}
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Format a numeric label as a count-up render. */
function MotionNumber({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  active,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  active: boolean;
  className?: string;
}) {
  const v = useCountUp(value, active);
  return (
    <span className={className}>
      {prefix}
      {v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* Numeric form of each trust metric for animated count-up. */
const TRUST_NUMERIC: Record<
  string,
  { num: number; prefix?: string; suffix?: string; decimals?: number }
> = {
  "Requests / min": { num: 8.4, suffix: "M", decimals: 1 },
  "p50 latency": { num: 12, suffix: "ms" },
  Uptime: { num: 99.99, suffix: "%" },
  Models: { num: 100, suffix: "+" },
  Engineers: { num: 12.4, suffix: "k", decimals: 1 },
};

const TRUST_SPARKLINES: Record<string, number[]> = {
  "Requests / min": [
    6.1, 5.8, 6.4, 6.0, 7.0, 6.7, 7.4, 7.1, 7.8, 7.5, 8.0, 7.7, 8.4,
  ],
  "p50 latency": [14, 13, 12, 13, 12, 12, 11, 12, 12, 13, 12, 12, 12],
  Uptime: [
    99.94, 99.96, 99.97, 99.95, 99.98, 99.97, 99.99, 99.98, 99.99, 99.99, 99.98,
    99.99, 99.99,
  ],
  Models: [62, 71, 78, 85, 90, 93, 96, 98, 99, 100, 100, 100, 100],
  Engineers: [
    8.2, 9.0, 9.6, 10.1, 10.8, 11.2, 11.6, 11.9, 12.0, 12.2, 12.3, 12.3, 12.4,
  ],
};

/* ── Trust strip ── */

function TrustStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stripRef, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={stripRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mt-10 lg:mt-14"
    >
      <GlassCard className="px-5 lg:px-8 py-5 lg:py-6">
        {/* Caption row — reinforces this is infra telemetry, not vanity */}
        <div className="flex items-center justify-between mb-5 lg:mb-6">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: `radial-gradient(circle, ${ACCENT.statusHex} 0%, #047857 100%)`,
                boxShadow: `0 0 8px ${ACCENT.statusHex}`,
              }}
              aria-hidden
            />
            <span className="text-[10px] font-mono text-white/45 tracking-[0.22em] uppercase">
              Live · platform telemetry
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/25 tabular-nums">
            updated just now
          </span>
        </div>
        <ul
          role="list"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-5 gap-x-2 lg:gap-x-4"
        >
          {TRUST_METRICS.map((m, i) => {
            const Icon = m.icon;
            const num = TRUST_NUMERIC[m.label];
            const spark = TRUST_SPARKLINES[m.label];
            const sparkColor =
              i === 0
                ? "#a5b4fc"
                : i === 1
                  ? "#7df0e3"
                  : i === 2
                    ? "#6ee7b7"
                    : i === 3
                      ? "#c4b5fd"
                      : "#fcd34d";
            return (
              <li
                key={m.label}
                className={cn(
                  "flex items-center gap-3 lg:gap-4",
                  i > 0 && "lg:pl-4 lg:border-l lg:border-white/[0.06]",
                )}
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] text-indigo-200/80"
                  aria-hidden
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-xl font-semibold text-white tracking-tight tabular-nums leading-none">
                    {num ? (
                      <MotionNumber
                        value={num.num}
                        prefix={num.prefix}
                        suffix={num.suffix}
                        decimals={num.decimals}
                        active={inView}
                      />
                    ) : (
                      m.value
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 min-w-0">
                    <Sparkline
                      data={spark}
                      color={sparkColor}
                      className="w-12 h-3.5 shrink-0"
                      width={48}
                      height={14}
                    />
                    <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-white/40 truncate">
                      {m.label}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

/* ── Sticky Journey Tracker ── */

function JourneyTracker({
  activeId,
  progress,
}: {
  activeId: StepId | null;
  progress: number;
}) {
  return (
    <nav
      aria-label="Onboarding journey"
      className="hidden lg:block lg:sticky lg:top-32"
    >
      <div className="relative pl-7">
        <div
          aria-hidden
          className="absolute left-2.5 top-2 bottom-2 w-px"
          style={{
            background:
              "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.18) 50%, rgba(99,102,241,0.08) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute left-2.5 top-2 w-px origin-top"
          style={{
            height: "calc(100% - 1rem)",
            background: `linear-gradient(180deg, ${ACCENT.hex} 0%, ${ACCENT.hexSoft} 100%)`,
            transform: `scaleY(${progress})`,
            transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: 0.55,
          }}
        />
        <ol role="list" className="space-y-7">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = activeId === s.id;
            const isPast =
              activeId !== null &&
              STEPS.findIndex((x) => x.id === activeId) > i;
            return (
              <li key={s.id} className="relative">
                <div
                  aria-hidden
                  className="absolute -left-[18px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{
                    background: isActive
                      ? `radial-gradient(circle at 30% 30%, #c7d2fe 0%, ${ACCENT.hex} 70%, #4338ca 100%)`
                      : isPast
                        ? `radial-gradient(circle at 30% 30%, #a5b4fc 0%, ${ACCENT.hex} 90%)`
                        : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 100%)",
                    boxShadow: isActive ? ACCENT.ringGlow : "none",
                  }}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-50 bg-indigo-400/40" />
                  )}
                </div>
                <a
                  href={`#step-${s.id}`}
                  className={cn(
                    "block group transition-opacity duration-300",
                    !isActive && !isPast && "opacity-50 hover:opacity-80",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-[10px] font-mono tracking-[0.22em] uppercase",
                        isActive ? "text-indigo-200" : "text-white/35",
                      )}
                    >
                      Step {s.id}
                    </span>
                    <span className="text-[10px] font-mono text-white/25">
                      · {s.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 transition-colors duration-300",
                        isActive
                          ? "text-indigo-200"
                          : isPast
                            ? "text-indigo-300/70"
                            : "text-white/40",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "text-[15px] font-medium tracking-tight transition-colors duration-300",
                        isActive ? "text-white" : "text-white/65",
                      )}
                    >
                      {s.title}{" "}
                      <span
                        className={cn(
                          "font-display italic font-normal",
                          isActive ? "text-indigo-200/95" : "text-white/45",
                        )}
                      >
                        {s.italic}
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/* ── Mobile Journey Tracker — sticky bottom rail on small screens ── */

function MobileJourneyTracker({ activeId }: { activeId: StepId | null }) {
  const activeIdx = activeId ? STEPS.findIndex((s) => s.id === activeId) : -1;
  const pct = activeIdx >= 0 ? ((activeIdx + 1) / STEPS.length) * 100 : 0;
  return (
    <nav
      aria-label="Onboarding journey"
      className="lg:hidden sticky bottom-4 z-30"
    >
      <div className="rounded-2xl border border-white/[0.08] bg-black/70 backdrop-blur-xl px-3 py-2.5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = activeId === s.id;
            const isPast =
              activeId !== null &&
              STEPS.findIndex((x) => x.id === activeId) >
                STEPS.findIndex((x) => x.id === s.id);
            return (
              <a
                key={s.id}
                href={`#step-${s.id}`}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : isPast
                      ? "text-indigo-200/80"
                      : "text-white/40",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
                <span className="text-[8px] font-mono tracking-wider uppercase">
                  {s.id}
                </span>
              </a>
            );
          })}
        </div>
        <div className="mt-2 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full origin-left rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${ACCENT.hex}, ${ACCENT.hexSoft})`,
              transition: "width 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      </div>
    </nav>
  );
}

/* ── Micro-viz: Step 01 — Live signup ── */

function LiveSignupViz() {
  const initial = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const visible = useDocumentVisible();
  const [signups, setSignups] = useState<
    { initials: string; city: string; age: number; id: number }[]
  >(() => [
    { initials: "MK", city: "Berlin", age: 4, id: 1 },
    { initials: "JL", city: "San Francisco", age: 7, id: 2 },
    { initials: "SO", city: "Tokyo", age: 11, id: 3 },
  ]);
  const idRef = useRef(3);
  const ageRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    const cities = [
      "Berlin",
      "San Francisco",
      "Tokyo",
      "London",
      "Bengaluru",
      "Sao Paulo",
      "Seoul",
      "Toronto",
      "Sydney",
      "Lagos",
      "Paris",
      "Singapore",
    ];
    const interval = setInterval(() => {
      const a = initial[Math.floor(Math.random() * initial.length)];
      const b = initial[Math.floor(Math.random() * initial.length)];
      const c = cities[Math.floor(Math.random() * cities.length)];
      idRef.current += 1;
      setSignups((prev) =>
        [
          { initials: a + b, city: c, age: 0, id: idRef.current },
          ...prev,
        ].slice(0, 4),
      );
    }, 4000);

    const ageTimer = setInterval(() => {
      ageRef.current += 1;
      setSignups((prev) => prev.map((s) => ({ ...s, age: s.age + 3 })));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(ageTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 relative rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
        }}
      />
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: `radial-gradient(circle, ${ACCENT.statusHex} 0%, #047857 100%)`,
              boxShadow: `0 0 8px ${ACCENT.statusHex}`,
            }}
            aria-hidden
          />
          <span className="text-[10px] font-mono text-white/45 tracking-widest uppercase">
            Live · signups
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/25 tabular-nums">
          {signups.length * 23 + 18402} this hour
        </span>
      </div>
      <ul role="list" className="p-3 space-y-2">
        <AnimatePresence initial={false}>
          {signups.map((s) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -12, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 12, height: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold text-indigo-100 border border-indigo-300/30"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.4) 0%, rgba(67,56,202,0.6) 100%)",
                }}
                aria-hidden
              >
                {s.initials}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2 text-[12px] font-mono">
                <span className="text-white/70 truncate">
                  anon@{s.city.toLowerCase().replace(/\s/g, "")}.dev
                </span>
                <span className="text-emerald-300/80">just signed up</span>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-white/25 tabular-nums">
                {s.age}s ago
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/* ── Micro-viz: Step 02 — API key reveal ── */

function KeyRevealViz() {
  const [revealed, setRevealed] = useState(false);
  const fullKey = "sk-yap-7H4kL9pX2mN8qR5vB3wT1jF6yC0zD";
  const masked = "sk-yap-•••••••••••••••••••••••••••••";
  const { copied, copy } = useCopy();

  return (
    <div className="mt-6 relative rounded-2xl border border-white/[0.08] bg-black/50 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
        }}
      />
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
        <span className="text-[10px] font-mono text-white/45 tracking-widest uppercase">
          API Key · default
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/80">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: `radial-gradient(circle, ${ACCENT.statusHex} 0%, #047857 100%)`,
              boxShadow: `0 0 6px ${ACCENT.statusHex}`,
            }}
            aria-hidden
          />
          active
        </span>
      </div>
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <code
          className={cn(
            "flex-1 min-w-0 font-mono text-[12px] tracking-wide tabular-nums",
            "px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]",
            "motion-safe:transition-[filter,color,text-shadow] duration-500 select-all",
            revealed ? "text-white/85" : "text-white/55",
          )}
          style={{
            filter: revealed ? "blur(0)" : "blur(2.5px)",
            textShadow: revealed ? "none" : "0 0 8px rgba(255,255,255,0.15)",
          }}
        >
          {revealed ? fullKey : masked}
        </code>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-pressed={revealed}
            className={cn(
              "inline-flex items-center justify-center min-h-[40px] px-3.5 rounded-lg text-[11px] font-mono",
              "motion-safe:transition-[background-color,border-color,color] duration-200",
              "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15]",
              "text-white/65 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60",
            )}
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button
            type="button"
            onClick={() => copy(fullKey)}
            aria-label={
              copied
                ? "API key copied to clipboard"
                : "Copy API key to clipboard"
            }
            className={cn(
              "inline-flex items-center justify-center gap-1.5 min-h-[40px] min-w-[40px] px-3 rounded-lg text-[11px] font-mono",
              "motion-safe:transition-[background-color,border-color,color] duration-200",
              "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60",
              copied
                ? "text-emerald-300 border-emerald-500/40"
                : "text-white/65 hover:text-white",
            )}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Micro-viz: Step 03 — Code with language tabs ── */

function CodeBlockWithTabs() {
  const [lang, setLang] = useState<Lang>("ts");
  const tokens = CODE_BY_LANG[lang];
  const codePlain = useMemo(
    () =>
      tokens.map((line) => line.tokens.map((t) => t.text).join("")).join("\n"),
    [tokens],
  );
  const { copied, copy } = useCopy();
  const meta = LANG_META[lang];
  const reducedMotion = useReducedMotion();
  const inViewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(inViewRef, { once: true, margin: "-40px" });
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-cycle languages as a passive demo, until the user interacts.
  const [userInteracted, setUserInteracted] = useState(false);
  useEffect(() => {
    if (userInteracted || reducedMotion || !inView) return;
    const langs: Lang[] = ["ts", "py", "curl"];
    cycleTimer.current = setInterval(() => {
      setLang((prev) => {
        const i = langs.indexOf(prev);
        return langs[(i + 1) % langs.length];
      });
    }, 3200);
    return () => {
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, [userInteracted, reducedMotion, inView]);

  return (
    <div
      ref={inViewRef}
      className="mt-7 relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_20px_40px_-20px_rgba(0,0,0,0.6)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
        }}
      />
      {/* CRT-style slow scanline sweep — reinforces the terminal metaphor */}
      {!reducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-16 z-10"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.06) 50%, transparent 100%)",
          }}
          initial={{ y: "-20%" }}
          whileInView={{ y: ["-20%", "120%"] }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="hidden sm:flex gap-1.5 shrink-0">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #ff8b8b 0%, #ef4444 70%, #991b1b 100%)",
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.3)",
              }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #ffd87b 0%, #f59e0b 70%, #92400e 100%)",
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.3)",
              }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #7bf0a3 0%, #10b981 70%, #065f46 100%)",
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.3)",
              }}
            />
          </div>
          <div
            role="tablist"
            aria-label="Code language"
            className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.04] min-w-0"
          >
            {(Object.keys(LANG_META) as Lang[]).map((l) => {
              const active = l === lang;
              return (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setUserInteracted(true);
                    setLang(l);
                  }}
                  className={cn(
                    "min-h-[28px] px-2.5 text-[10px] font-mono uppercase tracking-wider rounded-md",
                    "motion-safe:transition-[background-color,color] duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                    active
                      ? "bg-white/[0.06] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                      : "text-white/40 hover:text-white/70",
                  )}
                >
                  {LANG_META[l].label}
                </button>
              );
            })}
          </div>
          <span className="hidden md:inline text-[10px] text-white/30 font-mono truncate">
            {meta.file}
          </span>
        </div>
        <button
          type="button"
          onClick={() => copy(codePlain)}
          aria-label={
            copied ? "Code copied to clipboard" : "Copy code to clipboard"
          }
          className={cn(
            "shrink-0 inline-flex items-center justify-center min-h-[40px] min-w-[40px] gap-1.5 px-2.5 rounded-md text-[10px] font-mono",
            "motion-safe:transition-[background-color,border-color,color] duration-200",
            "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60",
            copied
              ? "text-emerald-300 border-emerald-500/40"
              : "text-white/45 hover:text-white/75",
          )}
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 lg:p-5 overflow-x-auto leading-[1.7] text-[12px]">
        <code>
          <AnimatePresence mode="wait">
            <motion.div
              key={lang}
              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {tokens.map((line, li) => (
                <div key={li} className="flex">
                  <span
                    aria-hidden
                    className="w-7 shrink-0 text-right pr-4 text-white/20 select-none tabular-nums border-r border-white/[0.05] mr-4"
                  >
                    {li + 1}
                  </span>
                  <span className="flex-1 min-w-0 whitespace-pre">
                    {line.tokens.length === 0
                      ? " "
                      : line.tokens.map((token, ti) => (
                          <span key={ti} className={TOKEN_STYLES[token.type]}>
                            {token.text || " "}
                          </span>
                        ))}
                  </span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </code>
      </pre>
    </div>
  );
}

/* ── Micro-viz: Step 04 — Mini live dashboard ── */

function MiniDashViz() {
  const visible = useDocumentVisible();
  const [reqPerMin, setReqPerMin] = useState(8421380);
  const [p95, setP95] = useState(47);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setReqPerMin((n) => n + Math.floor(Math.random() * 180) + 40);
      setP95((n) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(38, Math.min(58, n + delta));
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const spark = useMemo(
    () => [38, 42, 39, 45, 41, 44, 47, 43, 46, 44, 47, 45, 48, 46, 47],
    [],
  );
  const sparkMax = Math.max(...spark);
  const sparkPath = useMemo(
    () =>
      spark
        .map(
          (v, i) =>
            `${(i / (spark.length - 1)) * 100},${20 - (v / sparkMax) * 18}`,
        )
        .join(" "),
    [spark, sparkMax],
  );

  return (
    <div
      role="status"
      aria-live="off"
      className="mt-6 relative rounded-2xl border border-white/[0.08] bg-black/50 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
        }}
      />
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: `radial-gradient(circle, ${ACCENT.statusHex} 0%, #047857 100%)`,
              boxShadow: `0 0 6px ${ACCENT.statusHex}`,
            }}
            aria-hidden
          />
          <span className="text-[10px] font-mono text-white/45 tracking-widest uppercase">
            Gateway · live
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/25 tabular-nums">
          last 15m
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
        <div className="p-4">
          <div className="text-[10px] font-mono text-white/35 tracking-widest uppercase">
            Requests / min
          </div>
          <div className="mt-1.5 text-2xl font-semibold text-white tracking-tight tabular-nums">
            {(reqPerMin / 1000000).toFixed(2)}M
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/80">
            <span aria-hidden>▲</span>
            <span className="tabular-nums">
              +{((reqPerMin % 999) / 100) | 0}.{reqPerMin % 100}%
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-[10px] font-mono text-white/35 tracking-widest uppercase">
            p95 latency
          </div>
          <div className="mt-1.5 text-2xl font-semibold text-white tracking-tight tabular-nums">
            {p95}
            <span className="text-sm text-white/45 ml-0.5">ms</span>
          </div>
          <svg
            viewBox="0 0 100 22"
            preserveAspectRatio="none"
            className="mt-2 w-full h-5"
            aria-hidden
          >
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT.hex} stopOpacity="0.5" />
                <stop offset="100%" stopColor={ACCENT.hex} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={`0,20 ${sparkPath} 100,20`}
              fill="url(#sparkFill)"
              stroke="none"
            />
            <polyline
              points={sparkPath}
              fill="none"
              stroke={ACCENT.hexSoft}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Step card ── */

function StepCard({ step, index }: { step: Step; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-60px" });
  const Icon = step.icon;

  return (
    <motion.div
      ref={cardRef}
      id={`step-${step.id}`}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: 0.08 + index * 0.07,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative scroll-mt-32"
    >
      <GlassCard className="p-6 lg:p-9 motion-safe:transition-[transform,border-color,box-shadow] duration-500 hover:border-indigo-400/30 group">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-700"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 25%, transparent 75%, rgba(99,102,241,0.15) 100%)",
            filter: "blur(12px)",
            zIndex: -1,
          }}
        />

        {/* Massive step-number watermark — anchors asymmetry, signals editorial design */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-2 lg:-right-4 text-[7rem] lg:text-[10rem] font-display italic font-normal select-none leading-[0.8] motion-safe:transition-[opacity,transform] duration-700 group-hover:opacity-100 group-hover:translate-x-1"
          style={{
            color: "rgba(255,255,255,0.035)",
            textShadow: "0 0 80px rgba(99,102,241,0.10)",
          }}
        >
          {step.id}
        </span>

        <div className="flex items-start gap-5 lg:gap-7 relative z-10">
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent",
              "border border-white/[0.08] text-indigo-200",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
              "group-hover:text-indigo-100 group-hover:border-indigo-300/40",
              "motion-safe:transition-[color,border-color] duration-500",
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={1.75} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-indigo-300/70">
                Step {step.id}
              </span>
              <span className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
              <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-white/40">
                {step.duration}
              </span>
            </div>

            <h3 className="text-2xl lg:text-[1.75rem] font-semibold text-white tracking-tight leading-[1.15] text-balance">
              {step.title}{" "}
              <span className="font-display italic font-normal text-indigo-200/95">
                {step.italic}
              </span>
            </h3>

            <p className="mt-3 text-[14px] text-white/55 leading-relaxed max-w-prose group-hover:text-white/70 motion-safe:transition-colors duration-500 text-pretty">
              {step.desc}
            </p>

            {step.micro === "live-signup" && <LiveSignupViz />}
            {step.micro === "key-reveal" && <KeyRevealViz />}
            {step.micro === "code-tabs" && <CodeBlockWithTabs />}
            {step.micro === "mini-dash" && <MiniDashViz />}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ── Section ── */

export function IntegrationFlow() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [activeId, setActiveId] = useState<StepId | null>(null);
  const stepRefs = useRef<Record<StepId, HTMLElement | null>>({
    "01": null,
    "02": null,
    "03": null,
    "04": null,
  });

  // IntersectionObserver-based scroll-spy: one observer, no per-scroll
  // getBoundingClientRect loop. Big reduction in main-thread work on tall
  // sections with many steps mounted at once.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ratios = new Map<StepId, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const id = el.id.slice(-2) as StepId;
          if (!STIData.includes(id)) continue;
          ratios.set(id, e.intersectionRatio);
        }
        let bestId: StepId | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio >= 0.2) {
          setActiveId((prev) => (prev === bestId ? prev : bestId));
        }
      },
      {
        // Bias toward the upper-middle of the viewport so a single step is
        // always "active" while the section is in view.
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    // Observe step nodes (refs are populated by setStepRefs during commit,
    // which runs before this effect).
    for (const id of STIData) {
      const el = stepRefs.current[id];
      if (el) io.observe(el);
    }

    return () => io.disconnect();
  }, []);

  const progress = useMemo(() => {
    if (!activeId) return 0;
    const idx = STEPS.findIndex((s) => s.id === activeId);
    return (idx + 0.5) / STEPS.length;
  }, [activeId]);

  const setStepRefs = useCallback((node: HTMLOListElement | null) => {
    if (!node) return;
    STEPS.forEach((s) => {
      stepRefs.current[s.id] = node.querySelector<HTMLElement>(`#step-${s.id}`);
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 lg:py-40 px-4 overflow-hidden"
      aria-labelledby="integration-heading"
    >
      <AtmosphericBackground />

      <div className="relative max-w-7xl mx-auto">
        {/* ── Header (asymmetric) ── */}
        <div className="mb-16 lg:mb-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <div className="lg:col-span-7 relative">
            {/* Subtle terminal decoration — reinforces "blank terminal".
             * Contained inside the 7-col cell via right-2/lg:right-4 so it
             * never spills into the description column. */}
            <div
              aria-hidden
              className="pointer-events-none select-none absolute right-2 lg:right-4 top-2 opacity-[0.10] hidden sm:block"
            >
              <pre className="text-[9px] lg:text-[10px] font-mono leading-[1.6] text-white whitespace-pre">
                {`$ yapapa init
OK workspace ready
$ yapapa key create
OK sk-yap-... provisioned
$ yapapa deploy
-> live in 8m 42s`}
              </pre>
            </div>

            {/* "02" watermark with subtle indigo glow */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-16 lg:-top-24 -left-2 lg:-left-6 text-[10rem] lg:text-[18rem] font-display italic font-normal text-white/[0.025] select-none leading-none"
              style={{ textShadow: "0 0 100px rgba(99,102,241,0.12)" }}
            >
              02
            </span>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative inline-flex items-center gap-2.5 mb-6"
            >
              <span className="w-8 h-px bg-gradient-to-r from-indigo-400/0 via-indigo-300/80 to-indigo-300/0" />
              <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-indigo-200/70">
                Section 02 — Zero to Production
              </span>
            </motion.div>

            <motion.h2
              id="integration-heading"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.08,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-[2.75rem] sm:text-6xl lg:text-[6.5rem] font-semibold text-white tracking-[-0.04em] leading-[0.9] text-balance"
            >
              From signup to{" "}
              <span className="relative inline-block">
                <span className="font-display italic font-normal bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  first request.
                </span>
                <svg
                  aria-hidden
                  className="absolute -bottom-3 left-0 w-full h-3"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M0 6 Q75 1, 150 6 T300 6"
                    fill="none"
                    stroke="rgba(99,102,241,0.5)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 1.4, ease: "easeOut" }}
                  />
                </svg>
              </span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-5 lg:pb-2 space-y-6"
          >
            {/* Engineer-first callout badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-300/30 bg-indigo-500/10 backdrop-blur">
              <Sparkles className="w-3 h-3 text-indigo-300" strokeWidth={2} />
              <span className="text-[10px] font-mono text-indigo-200 tracking-[0.2em] uppercase">
                Engineer-first · Not procurement
              </span>
            </div>

            {/* Description — key phrase in italic indigo */}
            <p className="text-base lg:text-lg text-white/55 max-w-md leading-relaxed text-pretty">
              The whole path from blank terminal to live request —{" "}
              <span className="font-display italic text-indigo-200/85">
                four steps, under ten minutes, zero paperwork.
              </span>
            </p>

            {/* Stat chips — 4 steps · <10 min · 0 paperwork */}
            <div className="flex flex-wrap gap-2">
              {KEY_STATS.map((s) => {
                const Icon = s.icon;
                const accent = KEY_STAT_ACCENTS[s.accent];
                return (
                  <div
                    key={s.label}
                    className="group/stat relative inline-flex items-center gap-2.5 pl-2.5 pr-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-all duration-300"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.06]"
                      style={{
                        background: `radial-gradient(circle, ${accent.bg} 0%, transparent 70%)`,
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: accent.color }}
                        strokeWidth={1.75}
                      />
                    </div>
                    <div>
                      <div
                        className="text-base font-semibold text-white tabular-nums leading-none"
                        style={{ textShadow: `0 0 12px ${accent.glow}` }}
                      >
                        {s.value}
                      </div>
                      <div className="mt-0.5 text-[9px] font-mono tracking-[0.16em] uppercase text-white/45">
                        {s.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Trust strip ── */}
        <TrustStrip />

        {/* ── Steps + sticky tracker ── */}
        <div className="mt-16 lg:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-3">
            <JourneyTracker activeId={activeId} progress={progress} />
          </div>

          <div className="lg:col-span-9 relative">
            <div
              aria-hidden
              className="absolute left-0 top-0 bottom-0 w-px hidden lg:block"
              style={{
                background:
                  "linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(99,102,241,0.2) 50%, rgba(99,102,241,0.05) 100%)",
              }}
            />
            <div
              aria-hidden
              className="absolute left-[-2px] top-0 bottom-0 w-[5px] hidden lg:block"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.08) 50%, transparent 100%)",
                filter: "blur(3px)",
              }}
            />
            <ol ref={setStepRefs} className="space-y-6 lg:space-y-8 lg:pl-12">
              {STEPS.map((step, i) => (
                <StepCard key={step.id} step={step} index={i} />
              ))}
            </ol>
          </div>
        </div>

        {/* ── Mobile journey tracker — sticky bottom rail ── */}
        <div className="lg:hidden -mt-6">
          <MobileJourneyTracker activeId={activeId} />
        </div>

        {/* ── CTA panel (terminal-prompt aesthetic) ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 lg:mt-28"
        >
          <CTAPanel />
        </motion.div>
      </div>
    </section>
  );
}

/* ── CTA panel — terminal prompt aesthetic, mouse-follow spotlight ── */

function CTAPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Mouse-follow spotlight via CSS variables — cheap, no per-render.
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const r = panelRef.current?.getBoundingClientRect();
      if (!r) return;
      panelRef.current?.style.setProperty("--mx", `${e.clientX - r.left}px`);
      panelRef.current?.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    [reducedMotion],
  );

  return (
    <div
      ref={panelRef}
      onMouseMove={onMouseMove}
      className="group/panel relative rounded-[2rem] overflow-hidden border border-white/[0.08] bg-[#070710] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_30px_60px_-25px_rgba(0,0,0,0.6),0_0_120px_-50px_rgba(99,102,241,0.4)]"
    >
      <style>{`
        @keyframes s02-caret { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        .s02-caret { animation: s02-caret 1s steps(1, end) infinite; }
        @media (prefers-reduced-motion: reduce) { .s02-caret { animation: none; opacity: 1; } }
      `}</style>

      {/* Mouse-follow spotlight — pure CSS, only paints on hover. */}
      {!reducedMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover/panel:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(99,102,241,0.10), transparent 60%)",
          }}
        />
      )}

      {/* Static halo — was an infinite pulsing motion.div, now just a gradient. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 320px at 25% 0%, rgba(99,102,241,0.22) 0%, transparent 55%), radial-gradient(ellipse 500px 280px at 85% 100%, rgba(139,92,246,0.16) 0%, transparent 55%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Subtle blueprint grid — kept, but reduced opacity for contrast. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 0%, transparent 100%)",
        }}
      />
      {/* Top hairline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
        }}
      />

      <div className="relative z-10 p-8 sm:p-10 lg:p-14">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="max-w-xl">
            {/* Beta badge — refined. */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] backdrop-blur">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${ACCENT.statusHex} 0%, #047857 100%)`,
                  boxShadow: `0 0 8px ${ACCENT.statusHex}`,
                }}
                aria-hidden
              />
              <span className="text-[11px] text-emerald-200 font-mono tracking-[0.18em] uppercase">
                Open beta · Free forever
              </span>
            </div>

            {/* Headline — "request" in italic gradient, anchored to a real promise. */}
            <h3 className="text-[2.25rem] sm:text-5xl lg:text-[3.5rem] font-semibold text-white tracking-[-0.03em] leading-[1.04] text-balance">
              Ship your first{" "}
              <span className="font-display italic font-normal bg-gradient-to-br from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                request
              </span>{" "}
              tonight.
            </h3>

            <p className="mt-5 text-white/55 text-base lg:text-lg leading-relaxed text-pretty max-w-lg">
              Full access, zero commitment. No credit card, no expiring trial,
              no procurement call.
            </p>

            {/* Benefits — emerald check icons replace the old dot clusters. */}
            <ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-3 max-w-md">
              {[
                "No credit card",
                "All 100+ models",
                "Usage caps, not trials",
                "Keys in under 15s",
              ].map((g) => (
                <li key={g} className="flex items-center gap-2.5">
                  <span
                    className="shrink-0 w-4 h-4 rounded-md flex items-center justify-center bg-emerald-500/15 border border-emerald-400/30"
                    aria-hidden
                  >
                    <Check
                      className="w-2.5 h-2.5 text-emerald-300"
                      strokeWidth={3}
                    />
                  </span>
                  <span className="text-[13px] text-white/75 font-mono tracking-tight">
                    {g}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action stack — terminal prompt header + dual CTA buttons. */}
          <div className="shrink-0 flex flex-col items-stretch lg:items-end gap-3 lg:max-w-sm w-full lg:w-auto">
            {/* Prompt line — reinforces the section's terminal language. */}
            <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-4 px-1 mb-1">
              <div className="flex items-center gap-2 font-mono text-[11px] text-white/45">
                <Terminal
                  className="w-3.5 h-3.5 text-indigo-200/70"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span>
                  <span className="text-emerald-300">$</span>{" "}
                  <span className="text-white/60">ready to ship?</span>
                  <span className="s02-caret text-emerald-300">_</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className={cn(
                  "group/cta relative inline-flex items-center justify-center gap-3 min-h-[52px] px-7 rounded-2xl",
                  "bg-white text-black font-semibold text-[15px] overflow-hidden",
                  "motion-safe:transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]",
                  "shadow-[0_20px_40px_-12px_rgba(255,255,255,0.18),inset_0_1px_0_0_rgba(255,255,255,0.4)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070710]",
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full group-hover/cta:translate-x-full motion-safe:transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
                <span className="relative z-10 font-mono tracking-tight">
                  <span className="text-emerald-600">$</span> claim --free
                </span>
                <ArrowRight
                  className="relative z-10 w-4 h-4 motion-safe:transition-transform duration-300 group-hover/cta:translate-x-1"
                  strokeWidth={2.25}
                />
              </Link>
              <Link
                href="/docs"
                className={cn(
                  "group/secondary inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl",
                  "bg-white/[0.03] hover:bg-white/[0.07] text-white/80 hover:text-white border border-white/[0.08] hover:border-white/[0.18]",
                  "text-sm font-medium",
                  "motion-safe:transition-[background-color,border-color,color] duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070710]",
                )}
              >
                <BookOpen
                  className="w-4 h-4 text-white/55 group-hover/secondary:text-white"
                  strokeWidth={1.75}
                />
                <span>Read the docs</span>
                <ChevronRight
                  className="w-3.5 h-3.5 text-white/40 group-hover/secondary:translate-x-0.5 group-hover/secondary:text-white/70 motion-safe:transition-[transform,color] duration-200"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            </div>

            <p className="text-[11px] text-white/30 font-mono lg:text-right mt-1">
              No signup friction. No hidden fees. Cancel anything, anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
