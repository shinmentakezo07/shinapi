"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ArrowRight,
  Zap,
  Sparkles,
  Infinity as InfinityIcon,
} from "lucide-react";
import { creditPackages } from "@/lib/pricing-data";
import type { CreditPackage } from "@/lib/pricing-data";

type Accent = {
  bg: string;
  ring: string;
  text: string;
  glow: string;
  from: string;
  to: string;
};

function CyberButton({
  children,
  primary = false,
  className = "",
}: {
  children: React.ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      className={[
        "relative group/btn px-6 py-4 font-mono text-xs font-bold tracking-wider uppercase overflow-hidden transition-all duration-300 w-full",
        primary
          ? "text-black hover:shadow-[0_0_40px_rgba(59,130,246,0.45)]"
          : "text-white hover:shadow-[0_0_24px_rgba(255,255,255,0.08)]",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0 transition-all duration-300",
          primary
            ? "bg-white group-hover/btn:bg-cyan-300"
            : "bg-white/[0.04] border border-white/10 group-hover/btn:border-white/30 group-hover/btn:bg-white/[0.08]",
        ].join(" ")}
      />
      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-120%] group-hover/btn:translate-x-[120%] transition-transform duration-700 ease-in-out" />
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      {/* Corner ticks */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50" />
    </button>
  );
}

function PlanCard({
  plan,
  index,
  isPopular = false,
}: {
  plan: CreditPackage;
  index: number;
  isPopular?: boolean;
}) {
  const prefersReduced = useReducedMotion();

  const accentMap: Record<string, Accent> = {
    "text-blue-400": {
      bg: "bg-blue-500/20",
      ring: "ring-blue-500/20",
      text: "text-blue-400",
      glow: "rgba(59,130,246,0.35)",
      from: "rgba(59,130,246,0.18)",
      to: "rgba(34,211,238,0.10)",
    },
    "text-yellow-400": {
      bg: "bg-yellow-500/20",
      ring: "ring-yellow-500/20",
      text: "text-yellow-400",
      glow: "rgba(234,179,8,0.35)",
      from: "rgba(234,179,8,0.18)",
      to: "rgba(249,115,22,0.10)",
    },
    "text-purple-400": {
      bg: "bg-purple-500/20",
      ring: "ring-purple-500/20",
      text: "text-purple-400",
      glow: "rgba(168,85,247,0.35)",
      from: "rgba(168,85,247,0.18)",
      to: "rgba(236,72,153,0.10)",
    },
  };
  const accent = accentMap[plan.color] || accentMap["text-blue-400"];

  const numericAmount = Number(plan.amount.replace(/[^0-9.]/g, "")) || 0;
  const numericCredits = Number(plan.credits.replace(/[^0-9.]/g, "")) || 0;
  const creditsPerDollar =
    numericAmount > 0
      ? Math.round(numericCredits / numericAmount).toLocaleString()
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        delay: index * 0.12,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      whileHover={prefersReduced ? undefined : { y: -8 }}
      className={`relative ${isPopular ? "md:-translate-y-3" : ""}`}
    >
      {/* Tier accent halo — floats behind card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -top-10 h-40 blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-90 rounded-full"
        style={{
          background: `radial-gradient(60% 60% at 50% 40%, ${accent.from}, transparent 70%)`,
        }}
      />

      {/* Popular rotating ring */}
      {isPopular && (
        <div className="absolute -inset-[1.5px] rounded-[32px] opacity-60 blur-[2px] overflow-hidden">
          <motion.div
            aria-hidden
            animate={prefersReduced ? undefined : { rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%]"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${accent.glow} 12%, transparent 25%, transparent 60%, ${accent.glow} 72%, transparent 85%)`,
            }}
          />
        </div>
      )}

      {/* Card outer — matches hero glass-card pattern exactly */}
      <div className="glass-card rounded-[32px] p-1 relative overflow-hidden group h-full">
        {/* Hover gradient overlay */}
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(to bottom right, ${accent.from}, transparent 55%)`,
          }}
        />

        {/* Scanline sheen on hover */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          }}
        />

        {/* Inner content */}
        <div className="relative h-full bg-[#0A0A0A] rounded-[28px] p-7 md:p-8 flex flex-col border border-white/5 z-10">
          {/* Tier index readout */}
          <div className="absolute top-5 right-5 font-mono text-[10px] tracking-[0.3em] uppercase text-white/20 select-none">
            TIER_{String(index + 1).padStart(2, "0")}
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div
              className={[
                "w-14 h-14 rounded-2xl flex items-center justify-center ring-1 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3",
                accent.bg,
                accent.ring,
                plan.color,
              ].join(" ")}
            >
              <plan.icon className="w-7 h-7" strokeWidth={1.5} />
            </div>

            {isPopular ? (
              <span className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-[10px] font-mono font-bold tracking-widest uppercase mt-0">
                {/* pulsing dot */}
                {!prefersReduced && (
                  <motion.span
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.9)]"
                  />
                )}
                <Sparkles className="w-3 h-3" />
                Best Value
              </span>
            ) : null}
          </div>

          {/* Name & Description */}
          <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
            {plan.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-7">
            {plan.description}
          </p>

          {/* Price */}
          <div className="mb-5">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium text-muted-foreground">
                $
              </span>
              <span className="text-5xl md:text-6xl font-bold tracking-tighter text-white tabular-nums">
                {plan.amount.replace("$", "")}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mt-1.5 flex items-center gap-1.5">
              <InfinityIcon className="w-3 h-3" strokeWidth={2} />
              one-time payment
            </span>
          </div>

          {/* Credits + value stat */}
          <div className="space-y-2.5 mb-6">
            <div
              className={[
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 w-full",
              ].join(" ")}
            >
              <span className={`text-sm font-bold ${plan.color}`}>
                {plan.creditsDisplay}
              </span>
              {plan.bonus && (
                <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded font-mono text-[9px] font-bold border border-emerald-500/25">
                  {plan.bonus}
                </span>
              )}
            </div>

            {/* Value-per-dollar stat */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/70">
                Value
              </span>
              <span className="font-mono text-xs font-bold text-white/80 tabular-nums">
                {creditsPerDollar}{" "}
                <span className="text-muted-foreground/60 font-medium">
                  cr / $1
                </span>
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6" />

          {/* Features */}
          <ul className="space-y-2.5 mb-8 flex-1">
            {plan.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-white/90 group/feat"
              >
                <span
                  className={[
                    "mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ring-1 transition-transform duration-300 group-hover/feat:scale-110",
                    accent.bg,
                    accent.ring,
                  ].join(" ")}
                >
                  <Check
                    className={`w-2.5 h-2.5 ${plan.color}`}
                    strokeWidth={3}
                  />
                </span>
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <CyberButton primary={isPopular} className="w-full">
            {plan.cta}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </CyberButton>
        </div>
      </div>
    </motion.div>
  );
}

export function CreditPackages() {
  return (
    <section
      id="credits"
      className="relative w-full py-32 px-4 bg-[#050505] overflow-hidden"
    >
      {/* Background — matches hero exactly */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 perspective-1000">
          <motion.div
            animate={{ backgroundPosition: ["0px 0px", "0px 40px"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-grid-white opacity-[0.08] transform-gpu rotate-x-12 scale-150 origin-top"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]" />
      </div>

      {/* HUD Corner Brackets */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden lg:block">
        <div className="absolute top-10 left-10 w-16 h-16 border-l-2 border-t-2 border-white/10 rounded-tl-2xl" />
        <div className="absolute top-10 right-10 w-16 h-16 border-r-2 border-t-2 border-white/10 rounded-tr-2xl" />
        <div className="absolute bottom-10 left-10 w-16 h-16 border-l-2 border-b-2 border-white/10 rounded-bl-2xl" />
        <div className="absolute bottom-10 right-10 w-16 h-16 border-r-2 border-b-2 border-white/10 rounded-br-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header — matches hero badge + headline style */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-mono font-bold tracking-widest uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            Credit Packages
            <span className="text-violet-400/40 font-normal normal-case tracking-normal">
              // pay-as-you-go
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6"
          >
            Simple <span className="text-gradient">Pricing</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Pay only for what you use. Add credits anytime.{" "}
            <span className="text-white font-medium">No subscriptions</span>, no
            expiry.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {creditPackages.map((plan, i) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              index={i}
              isPopular={plan.popular}
            />
          ))}
        </div>

        {/* Bottom trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
        >
          {["No subscriptions", "Credits never expire", "Cancel anytime"].map(
            (item) => (
              <span
                key={item}
                className="flex items-center gap-2 text-xs text-muted-foreground font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                {item}
              </span>
            ),
          )}
        </motion.div>
      </div>
    </section>
  );
}
