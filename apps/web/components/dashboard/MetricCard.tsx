"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  index?: number;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-blue-400",
  iconBg = "bg-blue-500/10",
  index = 0,
}: MetricCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="relative h-full flex flex-col justify-between p-5 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden hover:border-white/[0.12] transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-2.5 rounded-xl ${iconBg} border border-white/[0.04]`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {change && (
            <span
              className={`text-[11px] font-mono font-medium ${changeColors[changeType]}`}
            >
              {change}
            </span>
          )}
        </div>
        <div className="mt-auto">
          <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
            <AnimatedCounter target={value} />
          </div>
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.1em] font-medium mt-1.5">
            {title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
