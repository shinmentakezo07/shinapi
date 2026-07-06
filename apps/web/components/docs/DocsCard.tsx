"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Shared docs visual primitives — "Glass Atelier" refinement
   These give every topic page one consistent, refined language.
   ───────────────────────────────────────────────────────────── */

/* Soft glass surface used for content cards across docs */
export const DocsCard = ({
  children,
  className,
  interactive = true,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: boolean;
}) => (
  <div
    className={cn(
      "group relative rounded-2xl overflow-hidden",
      "border border-white/[0.07] bg-gradient-to-br from-white/[0.025] via-white/[0.01] to-transparent",
      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
      interactive &&
        "hover:border-indigo-500/25 hover:from-indigo-500/[0.04] hover:to-transparent",
      interactive &&
        "hover:shadow-[0_8px_32px_-12px_rgba(99,102,241,0.22),inset_0_1px_0_0_rgba(255,255,255,0.07)]",
      "transition-all duration-300",
      className,
    )}
  >
    {/* Top hairline highlight */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />
    {glow && (
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)",
          filter: "blur(36px)",
        }}
      />
    )}
    <div className="relative">{children}</div>
  </div>
);

/* Icon tile with the signature glass treatment */
export const DocsIconTile = ({
  icon: Icon,
  className,
  size = "md",
}: {
  icon: React.ElementType;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const dims =
    size === "sm" ? "w-9 h-9" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-[18px] h-[18px]";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center flex-shrink-0 rounded-xl overflow-hidden",
        "border border-white/[0.07] bg-white/[0.02]",
        "group-hover:border-indigo-500/25 group-hover:bg-indigo-500/[0.06]",
        "transition-all duration-300",
        dims,
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Icon className={cn(iconSize, "text-white/45 group-hover:text-indigo-200 transition-colors duration-300")} />
    </div>
  );
};

/* Small mono tag / chip */
export const DocsTag = ({
  children,
  className,
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] tracking-[0.06em]",
      "border",
      accent
        ? "border-indigo-500/20 bg-indigo-500/[0.06] text-indigo-200/80"
        : "border-white/[0.08] bg-white/[0.03] text-white/40",
      className,
    )}
  >
    {children}
  </span>
);

/* Stat block */
export const DocsStat = ({
  value,
  label,
  accent = "text-indigo-200",
}: {
  value: string;
  label: string;
  accent?: string;
}) => (
  <div
    className={cn(
      "px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.02]",
      accent,
      "text-[10px] font-mono font-bold",
    )}
  >
    {value} <span className="font-normal opacity-55">{label}</span>
  </div>
);

/* Reusable responsive grid for feature/card layouts */
export const DocsGrid = ({
  children,
  cols = 3,
  className,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) => {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return <div className={cn("grid gap-3", colClass, className)}>{children}</div>;
};

/* Section sub-heading used inside docs content (replaces raw <h3>) */
export const DocsSubhead = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={cn(
      "text-white/95 font-semibold text-sm mb-4 mt-12 flex items-center gap-2.5 tracking-[-0.01em]",
      className,
    )}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(165,180,252,0.6)]" />
    {children}
  </h3>
);

/* Section eyebrow label used inside content */
export const DocsLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-indigo-200/55",
      className,
    )}
  >
    {children}
  </span>
);

/* Inline key/value definition row */
export const DocsDef = ({
  term,
  desc,
  mono,
}: {
  term: string;
  desc: string;
  mono?: boolean;
}) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
    <span
      className={cn(
        "text-white/70 text-[13px] font-medium flex-shrink-0",
        mono && "font-mono text-[12px] text-indigo-200/85",
      )}
    >
      {term}
    </span>
    <span className="text-white/40 text-[12.5px] text-right leading-[1.55]">
      {desc}
    </span>
  </div>
);

/* Stagger container for cards */
export const DocsStagger = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const docsItem = {
  hidden: { opacity: 0, y: 18, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 140, damping: 22 },
  },
};
