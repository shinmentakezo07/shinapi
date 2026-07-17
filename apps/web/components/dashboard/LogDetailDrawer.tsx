"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Clock,
  Zap,
  Hash,
  User,
  KeyRound,
  AlertCircle,
  ChevronUp,
} from "lucide-react";
import type { APILog } from "@/lib/api/sdk";

interface LogDetailDrawerProps {
  log: APILog | null;
  onClose: () => void;
}

const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 28 },
  },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.25 } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors group"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  copyable,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-2 -mx-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.015] rounded-lg transition-colors group">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-slate-600" />
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-sm text-white truncate max-w-[200px] ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

export function LogDetailDrawer({ log, onClose }: LogDetailDrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (log) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [log, onClose]);

  if (!log) return null;

  const isSuccess = log.status === "success";
  const StatusIcon = isSuccess ? ChevronUp : AlertCircle;
  const statusText = isSuccess ? "Request Succeeded" : "Request Failed";

  return (
    <AnimatePresence>
      {log && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0c0c0e] border-l border-white/[0.06] z-50 overflow-y-auto hero-scroll"
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0c0c0e]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Log Details
                </h2>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Request metadata
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </motion.button>
            </div>

            <div className="p-6 space-y-7">
              {/* Status Banner */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl p-5 border ${isSuccess ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-red-500/[0.03] border-red-500/10"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2.5 rounded-xl ${isSuccess ? "bg-emerald-500/10" : "bg-red-500/10"}`}
                  >
                    <StatusIcon
                      className={`w-5 h-5 ${isSuccess ? "text-emerald-400" : "text-red-400"}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${isSuccess ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {statusText}
                    </p>
                    {log.errorMessage && (
                      <p className="text-xs text-red-400/60 mt-1 font-mono break-all">
                        {log.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Model & Provider */}
              <Section icon={Hash} title="Model Information">
                <DetailRow
                  icon={Hash}
                  label="Model"
                  value={log.model}
                  mono
                  copyable
                />
                <DetailRow icon={User} label="Provider" value={log.provider} />
              </Section>

              {/* Tokens & Cost */}
              <Section icon={Zap} title="Usage & Cost">
                <DetailRow
                  icon={Zap}
                  label="Input Tokens"
                  value={log.inputTokens.toLocaleString()}
                  mono
                />
                <DetailRow
                  icon={Zap}
                  label="Output Tokens"
                  value={log.outputTokens.toLocaleString()}
                  mono
                />
                <DetailRow
                  icon={Zap}
                  label="Total Tokens"
                  value={(log.inputTokens + log.outputTokens).toLocaleString()}
                  mono
                />
                <div className="flex items-center justify-between py-3 px-2 -mx-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.015] rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">
                      Latency
                    </span>
                  </div>
                  <span className="text-sm font-mono text-white">
                    {log.latency}ms
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 px-2 -mx-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.015] rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">
                      Cost
                    </span>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">
                    ${(log.cost / 100000).toFixed(6)}
                  </span>
                </div>
              </Section>

              {/* Identifiers */}
              <Section icon={KeyRound} title="Identifiers">
                <DetailRow
                  icon={Hash}
                  label="Log ID"
                  value={log.id}
                  mono
                  copyable
                />
                {log.apiKeyId && (
                  <DetailRow
                    icon={KeyRound}
                    label="API Key ID"
                    value={log.apiKeyId}
                    mono
                    copyable
                  />
                )}
                <DetailRow
                  icon={User}
                  label="User ID"
                  value={log.userId}
                  mono
                  copyable
                />
              </Section>

              {/* Timestamp */}
              <Section icon={Clock} title="Timestamp">
                <DetailRow
                  icon={Clock}
                  label="Created"
                  value={new Date(log.createdAt).toLocaleString()}
                  mono
                />
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-semibold mb-3 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      <div className="bg-white/[0.015] rounded-xl border border-white/[0.04] p-1">
        {children}
      </div>
    </motion.div>
  );
}
