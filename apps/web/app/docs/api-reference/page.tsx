"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Search,
  X,
  Globe,
  Lock,
  Zap,
  Shield,
  Webhook,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  ArrowUpRight,
} from "lucide-react";

import { Section } from "@/components/docs/Section";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { EndpointCard } from "@/components/docs/EndpointCard";
import { cn } from "@/lib/utils";

import { API_CATEGORIES, makeExample } from "./data";
import { getDocsBaseUrl } from "@/lib/docs-config";

const BASE_URL = getDocsBaseUrl();

const ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function ApiReferencePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("public");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);

  const totalEndpoints = API_CATEGORIES.reduce(
    (acc, cat) => acc + cat.endpoints.length,
    0
  );

  /* ── Scroll spy ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-category");
            if (id) setActiveCategory(id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── Filtered data ── */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return API_CATEGORIES.map((cat) => ({
      ...cat,
      endpoints: cat.endpoints.filter((ep) => {
        const matchMethod = activeMethod ? ep.method === activeMethod : true;
        const matchQuery =
          !q ||
          ep.path.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q);
        return matchMethod && matchQuery;
      }),
    })).filter((cat) => cat.endpoints.length > 0);
  }, [searchQuery, activeMethod]);

  const scrollToCategory = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleCopyBaseUrl = useCallback(() => {
    void navigator.clipboard.writeText(BASE_URL);
    setCopiedBaseUrl(true);
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  }, []);

  return (
    <>
      {/* ── Sticky top bar (category pills) ── */}
      <div className="sticky top-[58px] z-30 -mx-6 sm:-mx-10 mb-8">
        <div className="bg-[#06060a]/85 backdrop-blur-xl border-b border-white/[0.06] pb-3 pt-3 px-6 sm:px-10">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/[0.08] scrollbar-track-transparent pb-1">
            {API_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "relative flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 cursor-pointer",
                    isActive
                      ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`
                      : "bg-white/[0.02] border-white/[0.06] text-white/35 hover:text-white/60 hover:bg-white/[0.04] hover:border-white/[0.08]"
                  )}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      "ml-0.5 px-1.5 py-px rounded-full text-[9px] font-mono",
                      isActive
                        ? "bg-white/10 text-white/80"
                        : "bg-white/[0.04] text-white/40"
                    )}
                  >
                    {cat.endpoints.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        <Section
          id="api-reference"
          icon={Code2}
          eyebrow="API"
          title="API Reference"
          italic="Endpoints"
          description={`Explore ${totalEndpoints} RESTful endpoints with full OpenAI-compatible streaming support. All endpoints return standard JSON responses unless otherwise noted.`}
        >
          {/* ── Search & Base URL ── */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-200/60 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter endpoints by path, description, or method..."
                  className="w-full bg-white/[0.025] border border-white/[0.07] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-indigo-500/35 focus:bg-indigo-500/[0.04] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider hidden sm:inline">
                  Base URL
                </span>
                <code className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-emerald-300/90 font-mono text-[13px] group cursor-pointer hover:border-white/[0.12] transition-all" onClick={handleCopyBaseUrl}>
                  <Terminal className="w-3.5 h-3.5 text-emerald-400/60" />
                  {BASE_URL}
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedBaseUrl ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/40" />
                    )}
                  </span>
                </code>
              </div>
            </div>

            {/* Method pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveMethod(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                  !activeMethod
                    ? "bg-indigo-500/[0.1] border-indigo-500/25 text-indigo-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                    : "bg-transparent border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.08]"
                )}
              >
                All
              </button>
              {ALL_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() =>
                    setActiveMethod((prev) => (prev === m ? null : m))
                  }
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-[0.1em] border transition-all cursor-pointer",
                    activeMethod === m
                      ? m === "GET"
                        ? "bg-emerald-500/[0.1] border-emerald-500/25 text-emerald-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        : m === "POST"
                        ? "bg-indigo-500/[0.1] border-indigo-500/25 text-indigo-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        : m === "PUT"
                        ? "bg-amber-500/[0.1] border-amber-500/25 text-amber-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        : m === "PATCH"
                        ? "bg-orange-500/[0.1] border-orange-500/25 text-orange-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        : "bg-rose-500/[0.1] border-rose-500/25 text-rose-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      : "bg-transparent border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.08]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Results count */}
            <AnimatePresence mode="wait">
              {(searchQuery || activeMethod) && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-xs text-white/40 font-mono"
                >
                  Showing{" "}
                  {filtered.reduce((n, c) => n + c.endpoints.length, 0)} of{" "}
                  {totalEndpoints} endpoints
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Categories ── */}
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">
                  No endpoints match your filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveMethod(null);
                  }}
                  className="mt-3 text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-4 cursor-pointer"
                >
                  Clear filters
                </button>
              </motion.div>
            ) : (
              filtered.map((cat) => (
                <motion.div
                  key={cat.id}
                  data-category={cat.id}
                  ref={(el) => {
                    sectionRefs.current[cat.id] = el;
                  }}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-12 scroll-mt-32"
                >
                  {/* Category header */}
                  <div
                    className={cn(
                      "flex items-center gap-3 mb-4 p-4 rounded-2xl border",
                      "bg-gradient-to-br from-white/[0.02] to-transparent",
                      cat.borderColor
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
                        cat.bgColor,
                        cat.borderColor
                      )}
                    >
                      <cat.icon className={cn("w-5 h-5", cat.textColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "text-lg font-semibold tracking-tight",
                          cat.textColor
                        )}
                      >
                        {cat.label}
                      </h3>
                      <p className="text-xs text-white/30 mt-0.5 font-mono">
                        {cat.endpoints.length} endpoint
                        {cat.endpoints.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {cat.id === "openai" && (
                      <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/[0.08] border border-sky-500/15 text-[10px] font-mono text-sky-200/80">
                        <Zap className="w-3 h-3" />
                        OpenAI Format
                      </span>
                    )}
                    {cat.id === "admin" && (
                      <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/[0.08] border border-rose-500/15 text-[10px] font-mono text-rose-200/80">
                        <Shield className="w-3 h-3" />
                        Admin Only
                      </span>
                    )}
                  </div>

                  {/* Endpoints */}
                  <div className="space-y-2">
                    {cat.endpoints.map((endpoint) => (
                      <EndpointCard
                        key={`${cat.id}-${endpoint.method}-${endpoint.path}`}
                        method={endpoint.method}
                        path={endpoint.path}
                        description={endpoint.description}
                        auth={endpoint.auth}
                      >
                        <CodeBlock
                          code={makeExample(endpoint)}
                          language="bash"
                        />
                      </EndpointCard>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </Section>
      </motion.div>
    </>
  );
}
