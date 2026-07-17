"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Cpu, Activity } from "lucide-react";
import Image from "next/image";

interface ModelCardProps {
  model: {
    id: string;
    name: string;
    provider: string;
    inputPrice: string;
    outputPrice: string;
    context: string;
    logo: string | null;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
    gradient?: string;
    popular?: boolean;
    speed?: string;
    description?: string;
  };
  index: number;
  onClick: () => void;
  featured?: boolean;
}

/**
 * Deterministic waveform generator.
 * Produces a unique "signal fingerprint" for each model ID,
 * reinforcing the instrument-panel / signal-lab aesthetic.
 */
function generateWaveform(id: string, points = 36): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const rng = (offset: number) => {
    const x = Math.sin(seed * 0.1 + offset * 1.7) * 10000;
    return x - Math.floor(x);
  };

  const width = 200;
  const height = 48;
  const step = width / (points - 1);
  const amplitude = height * 0.38;
  const center = height / 2;

  let path = `M 0 ${center}`;
  for (let i = 1; i < points; i++) {
    const x = i * step;
    const envelope = 1 + Math.sin((i / points) * Math.PI) * 0.5;
    const y = center + (rng(i) - 0.5) * amplitude * envelope;
    path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return path;
}

function ModelWaveform({ id, className }: { id: string; className?: string }) {
  const path = generateWaveform(id);
  return (
    <svg
      viewBox="0 0 200 48"
      fill="none"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="opacity-70"
      />
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
        className="opacity-10 blur-[2px]"
      />
    </svg>
  );
}

export function ModelCard({
  model,
  index,
  onClick,
  featured = false,
}: ModelCardProps) {
  const IconComponent = model.icon || Cpu;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        delay: (index % 6) * 0.05,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={`group relative cursor-pointer ${featured ? "md:col-span-2 md:row-span-2" : ""}`}
      onClick={onClick}
    >
      {/* Hover glow */}
      <div
        className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 ${
          model.popular
            ? "bg-gradient-to-br from-cyan-500/20 via-indigo-500/15 to-violet-500/20"
            : "bg-gradient-to-br from-white/8 via-white/4 to-transparent"
        }`}
      />

      <div className="relative h-full rounded-2xl border border-white/[0.06] bg-[#08080A] p-[1px] shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-colors duration-500 group-hover:border-white/[0.10]">
        <div className="relative h-full rounded-[15px] bg-[#0B0B0D] p-5 flex flex-col overflow-hidden">
          {/* Subtle top gradient line */}
          <div
            className={`absolute top-0 left-0 right-0 h-px ${
              model.popular
                ? "bg-gradient-to-r from-cyan-500/40 via-indigo-500/30 to-transparent"
                : "bg-gradient-to-r from-white/[0.08] to-transparent"
            }`}
          />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-11 h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
                {model.logo ? (
                  <Image
                    src={model.logo}
                    alt={`${model.provider} logo`}
                    width={24}
                    height={24}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <IconComponent
                    className={`w-5 h-5 ${model.color || "text-gray-400"}`}
                  />
                )}
              </div>

              <div className="min-w-0">
                <h3
                  className={`font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors truncate ${
                    featured ? "text-lg md:text-xl" : "text-base"
                  }`}
                >
                  {model.name}
                </h3>
                <p className="text-[11px] text-gray-500 font-mono uppercase tracking-wider truncate">
                  {model.provider}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {model.popular && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 text-cyan-300 text-[9px] font-mono font-bold tracking-wider uppercase">
                  <TrendingUp className="w-3 h-3" />
                  Hot
                </span>
              )}
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider px-2 py-0.5 bg-white/[0.03] rounded-md border border-white/[0.05]">
                {model.context}
              </span>
            </div>
          </div>

          {/* Signature waveform */}
          <div className="relative h-12 mb-5 rounded-lg border border-white/[0.04] bg-white/[0.015] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <ModelWaveform
                id={model.id}
                className={`w-full h-full ${model.popular ? "text-cyan-400/60" : "text-indigo-400/50"}`}
              />
            </div>
            {/* Grid overlay for oscilloscope feel */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "20px 10px",
              }}
            />
          </div>

          {/* Description (featured only) */}
          {featured && model.description && (
            <p className="text-sm text-gray-400 leading-relaxed mb-5 max-w-lg line-clamp-2">
              {model.description}
            </p>
          )}

          {/* Specs */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
              <Activity className="w-3 h-3 text-cyan-500/70" />
              {model.speed || "Fast"}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
              <span className="w-1 h-1 rounded-full bg-indigo-500/70" />
              {model.context}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Input
              </span>
              <span className="text-emerald-400 font-mono font-semibold text-sm">
                {model.inputPrice}/1M
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Output
              </span>
              <span className="text-indigo-400 font-mono font-semibold text-sm">
                {model.outputPrice}/1M
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-auto">
            <button className="relative w-full py-2.5 font-mono text-[11px] font-bold tracking-wider uppercase transition-all overflow-hidden group/btn text-gray-300 hover:text-white rounded-xl">
              <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.08] group-hover/btn:bg-white/[0.06] group-hover/btn:border-white/[0.14] transition-all duration-300 rounded-xl" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                View Details
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
