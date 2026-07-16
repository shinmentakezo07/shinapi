"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  HelpCircle,
  Mail,
  ArrowRight,
  ChevronDown,
  Coins,
  Zap,
  CreditCard,
  ListFilter,
  MessageCircle,
  BookOpen,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { pricingFAQ } from "@/lib/pricing-data";

const FAQ_CATEGORIES = [
  { label: "All", filter: null, icon: ListFilter },
  { label: "Credits", filter: "credits", icon: Coins },
  { label: "Models", filter: "models", icon: Zap },
  { label: "Billing", filter: "billing", icon: CreditCard },
] as const;

const FAQ_WITH_CATEGORIES = pricingFAQ.map((item) => {
  const q = item.question.toLowerCase();
  let category: "credits" | "models" | "billing" = "billing";
  if (
    q.includes("credit") ||
    q.includes("expire") ||
    q.includes("free tier") ||
    q.includes("run out")
  )
    category = "credits";
  else if (q.includes("model") || q.includes("switch")) category = "models";
  return { ...item, category };
});

const easeOut = [0.16, 1, 0.3, 1] as const;

function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
  reduce,
}: {
  item: (typeof FAQ_WITH_CATEGORIES)[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  reduce: boolean | null;
}) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <motion.div
      layout={!reduce}
      initial={{ opacity: 0, y: reduce ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: reduce ? 0 : index * 0.06,
        duration: reduce ? 0.1 : 0.45,
        ease: easeOut,
      }}
      className="group/item"
    >
      <div
        className={`relative rounded-2xl overflow-hidden transition-shadow duration-500 ${
          isOpen
            ? "shadow-[0_0_48px_-16px_rgba(139,92,246,0.35)]"
            : "shadow-none hover:shadow-[0_0_32px_-18px_rgba(139,92,246,0.2)]"
        }`}
      >
        {/* Gradient border — active only when open / hover */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0 group-hover/item:opacity-60"
          }`}
          style={{
            padding: "1px",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.55), rgba(236,72,153,0.28), rgba(59,130,246,0.2))",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          aria-hidden="true"
        />

        {/* Soft inner wash when open */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(139,92,246,0.12), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(236,72,153,0.08), transparent 50%)",
          }}
          aria-hidden="true"
        />

        <div
          className={`relative rounded-2xl backdrop-blur-xl border transition-all duration-500 ${
            isOpen
              ? "bg-white/[0.035] border-violet-500/25"
              : "bg-white/[0.02] border-white/[0.06] group-hover/item:bg-white/[0.035] group-hover/item:border-white/[0.12]"
          }`}
        >
          {/* Left accent rail */}
          <div
            className={`absolute left-0 top-4 bottom-4 w-[2px] rounded-full transition-all duration-500 ${
              isOpen
                ? "bg-gradient-to-b from-violet-400 via-fuchsia-400 to-pink-400 opacity-100 shadow-[0_0_12px_rgba(167,139,250,0.6)]"
                : "bg-white/10 opacity-0 group-hover/item:opacity-100"
            }`}
            aria-hidden="true"
          />

          <button
            id={buttonId}
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="w-full text-left flex items-center gap-4 p-5 md:p-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl"
          >
            <span
              className={`relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold font-mono tracking-wider transition-all duration-500 ${
                isOpen
                  ? "bg-gradient-to-br from-violet-500/35 to-fuchsia-500/20 text-violet-200 shadow-[0_0_18px_-4px_rgba(139,92,246,0.55)] ring-1 ring-violet-400/30"
                  : "bg-white/[0.04] text-gray-500 ring-1 ring-white/[0.06] group-hover/item:text-gray-300 group-hover/item:bg-white/[0.06]"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
              {isOpen && (
                <span
                  className="absolute -inset-px rounded-xl bg-gradient-to-br from-violet-400/20 to-transparent animate-pulse"
                  aria-hidden="true"
                />
              )}
            </span>

            <span
              className={`flex-1 text-[15px] md:text-base font-medium leading-snug transition-colors duration-300 ${
                isOpen
                  ? "text-white"
                  : "text-gray-200 group-hover/item:text-white"
              }`}
            >
              {item.question}
            </span>

            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{
                duration: reduce ? 0.1 : 0.3,
                ease: easeOut,
              }}
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                isOpen
                  ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/30"
                  : "bg-white/[0.04] text-gray-500 ring-1 ring-white/[0.06] group-hover/item:text-gray-300"
              }`}
              aria-hidden="true"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: reduce ? 0.1 : 0.35,
                  ease: easeOut,
                }}
                className="overflow-hidden"
              >
                <div className="px-5 md:px-6 pb-6 pt-0">
                  <div className="ml-[3.25rem] pl-5 border-l border-violet-500/25 relative">
                    <div
                      className="absolute -left-[1px] top-0 h-8 w-px bg-gradient-to-b from-violet-400 to-transparent"
                      aria-hidden="true"
                    />
                    <p className="text-sm md:text-[15px] text-gray-400 leading-relaxed max-w-xl">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function PricingFAQ() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(
    FAQ_WITH_CATEGORIES[0]?.question ?? null,
  );
  const reduce = useReducedMotion();

  const filtered = activeCategory
    ? FAQ_WITH_CATEGORIES.filter((item) => item.category === activeCategory)
    : FAQ_WITH_CATEGORIES;

  const categoryCounts = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    count:
      cat.filter === null
        ? FAQ_WITH_CATEGORIES.length
        : FAQ_WITH_CATEGORIES.filter((i) => i.category === cat.filter).length,
  }));

  return (
    <section
      className="relative w-full py-24 md:py-32 px-4 bg-[#000000] overflow-hidden"
      aria-labelledby="faq-heading"
    >
      {/* Top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
        aria-hidden="true"
      />

      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/5 w-[520px] h-[520px] bg-violet-600/[0.07] rounded-full blur-[120px] animate-glow-pulse" />
        <div
          className="absolute bottom-1/4 right-1/5 w-[420px] h-[420px] bg-fuchsia-600/[0.05] rounded-full blur-[110px] animate-glow-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[320px] bg-indigo-600/[0.04] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_78%)]" />
      </div>

      {/* HUD corners */}
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden lg:block"
        aria-hidden="true"
      >
        <div className="absolute top-10 left-10 w-14 h-14 border-l-2 border-t-2 border-white/10 rounded-tl-2xl" />
        <div className="absolute top-10 right-10 w-14 h-14 border-r-2 border-t-2 border-white/10 rounded-tr-2xl" />
        <div className="absolute bottom-10 left-10 w-14 h-14 border-l-2 border-b-2 border-white/10 rounded-bl-2xl" />
        <div className="absolute bottom-10 right-10 w-14 h-14 border-r-2 border-b-2 border-white/10 rounded-br-2xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 md:mb-14">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0.1 : 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] font-mono font-bold tracking-[0.2em] uppercase mb-6"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
              </span>
              <HelpCircle className="w-3.5 h-3.5" />
              FAQ
            </motion.div>

            <motion.h2
              id="faq-heading"
              initial={{ opacity: 0, y: reduce ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0.1 : 0.55, ease: easeOut }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]"
            >
              Got{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                questions?
              </span>
              <br />
              <span className="text-gray-500 text-3xl md:text-4xl lg:text-5xl font-semibold">
                We&apos;ve got answers.
              </span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : 0.12, duration: reduce ? 0.1 : 0.45 }}
            className="md:text-right md:pb-1 space-y-2"
          >
            <p className="text-sm text-gray-500 max-w-xs md:ml-auto leading-relaxed">
              Everything about credits, models, and billing — in one place.
            </p>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gray-600">
              {filtered.length} topic{filtered.length === 1 ? "" : "s"}
              {activeCategory ? ` · ${activeCategory}` : " · all categories"}
            </p>
          </motion.div>
        </div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: reduce ? 0 : 0.15, duration: reduce ? 0.1 : 0.4 }}
          className="flex items-center gap-2 mb-10 flex-wrap"
          role="tablist"
          aria-label="FAQ categories"
        >
          {categoryCounts.map((cat) => {
            const isActive = cat.filter === activeCategory;
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.label}
                type="button"
                role="tab"
                aria-selected={isActive}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                onClick={() => {
                  setActiveCategory(cat.filter);
                  setOpenKey(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-violet-100 border border-violet-400/35 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)]"
                    : "bg-white/[0.02] text-gray-500 border border-white/[0.06] hover:text-gray-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                <span
                  className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                    isActive
                      ? "bg-violet-400/20 text-violet-200"
                      : "bg-white/[0.04] text-gray-600"
                  }`}
                >
                  {cat.count}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Accordion list */}
          <div className="flex-1 min-w-0 space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((item, i) => (
                  <FAQItem
                    key={item.question}
                    item={item}
                    index={i}
                    isOpen={openKey === item.question}
                    onToggle={() =>
                      setOpenKey((prev) =>
                        prev === item.question ? null : item.question,
                      )
                    }
                    reduce={reduce}
                  />
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center"
                >
                  <Sparkles className="w-6 h-6 text-violet-400/70 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    No questions in this category yet.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Support rail */}
          <motion.aside
            initial={{ opacity: 0, x: reduce ? 0 : 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : 0.2, duration: reduce ? 0.1 : 0.5 }}
            className="lg:w-80 lg:shrink-0"
          >
            <div className="lg:sticky lg:top-8 space-y-4">
              {/* Contact card */}
              <div className="relative rounded-[28px] overflow-hidden group/card">
                <div
                  className="pointer-events-none absolute -inset-px rounded-[28px] opacity-70 group-hover/card:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(139,92,246,0.45), rgba(236,72,153,0.18), rgba(59,130,246,0.12))",
                  }}
                  aria-hidden="true"
                />
                <div className="relative m-[1px] rounded-[27px] bg-[#0A0A0A]/95 backdrop-blur-xl p-6 border border-white/[0.06] overflow-hidden">
                  <div
                    className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 bg-violet-500/15 rounded-full blur-3xl"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute -bottom-20 -left-10 w-36 h-36 bg-fuchsia-500/10 rounded-full blur-3xl"
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/10 ring-1 ring-violet-400/25 flex items-center justify-center shadow-[0_0_24px_-8px_rgba(139,92,246,0.55)]">
                        <Mail className="w-5 h-5 text-violet-300" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
                      Still have questions?
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">
                      Can&apos;t find what you need? Our team replies quickly —
                      usually within a few hours.
                    </p>

                    <a
                      href="mailto:support@yapapa.dev"
                      className="group/btn relative inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium cursor-pointer overflow-hidden transition-all duration-300 shadow-[0_0_28px_-8px_rgba(139,92,246,0.55)] hover:shadow-[0_0_36px_-6px_rgba(139,92,246,0.7)] hover:from-violet-500 hover:to-fuchsia-500"
                    >
                      <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 translate-x-[-120%] group-hover/btn:translate-x-[120%]" />
                      <span className="relative z-10 flex items-center gap-2">
                        Contact support
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <Link
                  href="/docs"
                  className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 ring-1 ring-blue-400/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                        Docs
                      </p>
                      <p className="text-[11px] text-gray-600">
                        API &amp; guides
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/gateway"
                  className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20 flex items-center justify-center group-hover:bg-fuchsia-500/15 transition-colors">
                      <MessageCircle className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                        Gateway
                      </p>
                      <p className="text-[11px] text-gray-600">
                        How it works
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 w-16 h-16 bg-violet-500/10 rounded-full blur-2xl"
                    aria-hidden="true"
                  />
                  <p className="text-2xl font-bold text-white tracking-tight mb-0.5">
                    100+
                  </p>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Models available
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 w-16 h-16 bg-fuchsia-500/10 rounded-full blur-2xl"
                    aria-hidden="true"
                  />
                  <p className="text-2xl font-bold text-white tracking-tight mb-0.5">
                    $0.001
                  </p>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Per credit start
                  </p>
                </div>
              </div>

              {/* Trust strip */}
              <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="text-gray-300 font-medium">
                    Credits never expire.
                  </span>{" "}
                  No subscriptions. Pay only for what you use.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
