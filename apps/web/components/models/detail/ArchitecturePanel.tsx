"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Wrench, FileJson, Brain, Radio, Code2 } from "lucide-react";
import type { OpenRouterModelData } from "@/types/model";
import { getProviderTheme } from "@/lib/model-utils";

interface ArchitecturePanelProps {
  model: OpenRouterModelData;
}

const ease = [0.16, 1, 0.3, 1] as const;

const modalityStyles: Record<
  string,
  { bg: string; border: string; text: string; dot: string; icon: string }
> = {
  text: {
    bg: "bg-sky-500/[0.06]",
    border: "border-sky-500/12",
    text: "text-sky-400",
    dot: "bg-sky-400",
    icon: "T",
  },
  image: {
    bg: "bg-violet-500/[0.06]",
    border: "border-violet-500/12",
    text: "text-violet-400",
    dot: "bg-violet-400",
    icon: "I",
  },
  audio: {
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/12",
    text: "text-amber-400",
    dot: "bg-amber-400",
    icon: "A",
  },
  video: {
    bg: "bg-rose-500/[0.06]",
    border: "border-rose-500/12",
    text: "text-rose-400",
    dot: "bg-rose-400",
    icon: "V",
  },
};

function ModalityPill({ mod, index }: { mod: string; index: number }) {
  const prefersReduced = useReducedMotion();
  const style = modalityStyles[mod.toLowerCase()] ?? {
    bg: "bg-white/[0.03]",
    border: "border-white/[0.06]",
    text: "text-gray-400",
    dot: "bg-gray-400",
    icon: "?",
  };
  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-[12px] font-semibold ${style.bg} ${style.border} ${style.text}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className="capitalize">{mod}</span>
    </motion.div>
  );
}

interface Capability {
  id: string;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

function deriveCapabilities(model: OpenRouterModelData): Capability[] {
  const caps: Capability[] = [];
  const params = model.supported_parameters || [];
  const arch = model.architecture;

  if (params.includes("tools") || params.includes("tool_choice")) {
    caps.push({
      id: "tools",
      label: "Function Calling",
      description:
        "Native tool / function-calling support with structured JSON args.",
      Icon: Wrench,
    });
  }
  if (params.includes("response_format")) {
    caps.push({
      id: "json",
      label: "JSON Mode",
      description: "Strict JSON output via response_format enforcement.",
      Icon: FileJson,
    });
  }
  if (
    arch?.instruct_type === "reasoning" ||
    model.name.match(/reasoning|thinking|r1|o1|o3|qwq/i) ||
    params.includes("reasoning_effort")
  ) {
    caps.push({
      id: "reasoning",
      label: "Reasoning Mode",
      description: "Chain-of-thought with optional reasoning_effort control.",
      Icon: Brain,
    });
  }
  if (params.includes("stream") || true /* streaming is universal */) {
    caps.push({
      id: "streaming",
      label: "Streaming",
      description: "Token-by-token SSE streaming out of the box.",
      Icon: Radio,
    });
  }
  // Code execution heuristic — Claude, GPT-4, DeepSeek Coder
  if (
    model.id.match(/claude|opus|gpt-4|deepseek.*coder|qwen.*coder|codestral/i) ||
    params.includes("code_execution")
  ) {
    caps.push({
      id: "code",
      label: "Code Generation",
      description:
        "Strong code generation / reasoning across major programming languages.",
      Icon: Code2,
    });
  }
  return caps;
}

function CapabilityBadge({
  capability,
  accent,
  index,
}: {
  capability: Capability;
  accent: string;
  index: number;
}) {
  const prefersReduced = useReducedMotion();
  const { Icon } = capability;
  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease, delay: 0.15 + index * 0.05 }}
      className="group relative rounded-lg border p-3 flex items-start gap-3 transition-colors duration-200"
      style={{
        backgroundColor: "rgba(255,255,255,0.012)",
        borderColor: `rgba(255,255,255,0.04)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}30`;
        e.currentTarget.style.backgroundColor = `${accent}06`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `rgba(255,255,255,0.04)`;
        e.currentTarget.style.backgroundColor = `rgba(255,255,255,0.012)`;
      }}
    >
      <div
        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200"
        style={{
          backgroundColor: `${accent}10`,
          color: accent,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono font-bold text-white tracking-tight">
          {capability.label}
        </div>
        <div className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
          {capability.description}
        </div>
      </div>
    </motion.div>
  );
}

export function ArchitecturePanel({ model }: ArchitecturePanelProps) {
  const arch = model.architecture;
  const prefersReduced = useReducedMotion();
  const theme = getProviderTheme(model.id);
  const accent = theme?.accent || "#6366f1";

  const capabilities = deriveCapabilities(model);

  const hasInput = arch?.input_modalities && arch.input_modalities.length > 0;
  const hasOutput =
    arch?.output_modalities && arch.output_modalities.length > 0;
  const hasTokenizer = !!arch?.tokenizer;
  const hasInstruct = !!arch?.instruct_type;

  const hasAnyContent =
    hasInput || hasOutput || hasTokenizer || hasInstruct || capabilities.length > 0;
  if (!hasAnyContent) return null;

  return (
    <motion.section
      initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease }}
      aria-label="Architecture details"
      id="architecture"
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className="text-[10px] font-mono font-bold tracking-wider"
          style={{ color: accent }}
        >
          03
        </span>
        <h2 className="text-[10px] font-mono tracking-[0.25em] uppercase text-gray-500">
          Architecture
        </h2>
        <span
          className="flex-1 h-px"
          style={{ backgroundColor: `${accent}12` }}
        />
      </div>

      <div
        className="rounded-2xl border p-6 relative overflow-hidden"
        style={{ borderColor: `${accent}12`, backgroundColor: `${accent}04` }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, ${accent}30, transparent)`,
          }}
        />

        {/* Modality pipeline */}
        {(hasInput || hasOutput) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6">
            {hasInput && (
              <div className="flex flex-col gap-2">
                <span className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.15em]">
                  Input
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {arch!.input_modalities!.map((mod: string, i: number) => (
                    <ModalityPill key={`in-${mod}`} mod={mod} index={i} />
                  ))}
                </div>
              </div>
            )}

            {hasInput && hasOutput && (
              <div className="hidden sm:flex items-center pt-4">
                <div className="flex items-center gap-1">
                  <div
                    className="w-8 h-px"
                    style={{
                      background: `linear-gradient(90deg, ${accent}20, ${accent}40)`,
                    }}
                  />
                  <ArrowRight
                    className="w-3.5 h-3.5"
                    style={{ color: `${accent}50` }}
                  />
                  <div
                    className="w-8 h-px"
                    style={{
                      background: `linear-gradient(90deg, ${accent}40, ${accent}20)`,
                    }}
                  />
                </div>
              </div>
            )}

            {hasOutput && (
              <div className="flex flex-col gap-2">
                <span className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.15em]">
                  Output
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {arch!.output_modalities!.map((mod: string, i: number) => (
                    <ModalityPill key={`out-${mod}`} mod={mod} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tokenizer + Instruct row */}
        {(hasTokenizer || hasInstruct) && (
          <div
            className="grid grid-cols-2 gap-5 pt-5"
            style={{ borderTopColor: `${accent}08`, borderTopWidth: 1 }}
          >
            {hasTokenizer && (
              <div>
                <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.12em] mb-2">
                  Tokenizer
                </div>
                <span className="font-mono text-[14px] text-gray-300 font-medium">
                  {arch!.tokenizer}
                </span>
              </div>
            )}
            {hasInstruct && (
              <div>
                <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.12em] mb-2">
                  Instruct type
                </div>
                <span className="font-mono text-[14px] text-gray-300 font-medium">
                  {arch!.instruct_type}
                </span>
              </div>
            )}
          </div>
        )}

        {/* NEW — Capability grid */}
        {capabilities.length > 0 && (
          <div
            className="pt-5 mt-5"
            style={{
              borderTopColor: `${accent}08`,
              borderTopWidth: 1,
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.18em]">
                Capabilities
              </span>
              <span className="text-[9px] font-mono text-gray-700">
                {capabilities.length} supported
              </span>
              <span className="flex-1 h-px bg-white/[0.03]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {capabilities.map((cap, i) => (
                <CapabilityBadge
                  key={cap.id}
                  capability={cap}
                  accent={accent}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
