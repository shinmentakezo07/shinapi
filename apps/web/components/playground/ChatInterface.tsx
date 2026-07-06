"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Bot,
  Orbit,
  Zap,
  Check,
  Columns3,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Message, ChatSession, EnrichedModel } from "./types";
import { getProviderColor, getProviderColorClass } from "./ProviderColors";

type ModelInfo = EnrichedModel;

interface ChatInterfaceProps {
  sessions: ChatSession[];
  sharedMessages: Message[];
  inputMessage: string;
  setInputMessage: (v: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onReset: () => void;
  onAddModel: () => void;
  streamingContent?: Record<string, string>;
  streamErrors?: Record<string, string>;
}

/* ───────────────────────── Empty state ───────────────────────── */

function EmptyState({ onAddModel }: { onAddModel: () => void }) {
  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden">
      {/* Asymmetric orbital system — off-center to avoid template symmetry */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[560px] h-[560px] -translate-x-[12%] -translate-y-[6%]">
          <div className="absolute inset-0 rounded-full border border-white/[0.02]" />
          <motion.div
            className="absolute inset-0 rounded-full border border-white/[0.02]"
            animate={{ rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500/20" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500/15" />
          </motion.div>
          <motion.div
            className="absolute inset-12 rounded-full border border-white/[0.03]"
            animate={{ rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500/20" />
            <div className="absolute top-1/4 right-0 translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-500/15" />
          </motion.div>
          <motion.div
            className="absolute inset-24 rounded-full border border-white/[0.04]"
            animate={{ rotate: 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-500/20" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 blur-2xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 max-w-md mx-auto px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-blue-500/15 flex items-center justify-center mx-auto mb-6"
        >
          <Orbit className="w-8 h-8 text-blue-400/80" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
          className="text-2xl font-bold text-white/90 tracking-tight mb-3 text-center"
        >
          Side-by-side inference
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
          className="text-sm text-gray-500 leading-relaxed mb-8 text-center"
        >
          Drop in two or more models and fire one prompt across every provider
          at once. Compare tone, latency and reasoning in a single, aligned
          frame.
        </motion.p>
        <div className="flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAddModel}
            className="relative inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600/90 to-violet-600/90 hover:from-blue-500 hover:to-violet-500 rounded-xl font-semibold text-sm text-white shadow-[0_0_28px_rgba(59,130,246,0.15)] hover:shadow-[0_0_36px_rgba(59,130,246,0.3)] transition-shadow overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Zap className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Select Models to Start</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── User bubble ───────────────────────── */

function UserMessageBubble({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="flex justify-end mb-6"
    >
      <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        <div className="absolute -inset-[1px] bg-gradient-to-br from-cyan-500/15 to-blue-500/8 rounded-2xl blur-sm opacity-50" />
        <div className="relative px-5 py-3.5 bg-gradient-to-br from-[#0d1117] to-[#0a0e14] border border-cyan-500/15 rounded-2xl rounded-tr-sm">
          <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <span className="block text-[10px] text-gray-700 font-mono mt-2 text-right tabular-nums">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Model response column ─────────────────────── */

function SplitFlapTime({ timestamp }: { timestamp: number }) {
  const t = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className="text-[10px] text-gray-700 font-mono tabular-nums tracking-tight">
      {t}
    </span>
  );
}

function ModelResponseCard({
  model,
  message,
  streamingContent,
  isStreaming,
  error,
}: {
  model: ModelInfo;
  message?: Message;
  streamingContent: string;
  isStreaming: boolean;
  error?: string;
}) {
  const [copied, setCopied] = useState(false);
  const content = message?.content || streamingContent;

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const providerColor = getProviderColor(model.id);
  const colorClass = getProviderColorClass(model.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="relative group h-full"
    >
      {/* provider-keyed glow — the structural differentiator */}
      <div
        className="absolute -inset-[1px] rounded-2xl blur-md opacity-25 group-hover:opacity-45 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${providerColor}22, ${providerColor}06)`,
        }}
      />
      <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border border-white/[0.05] bg-[#060608]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* provider accent rail on the left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ backgroundColor: providerColor }}
        />

        {/* Header */}
        <div
          className="relative flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]"
          style={{
            background: `linear-gradient(135deg, ${providerColor}0a, transparent 60%)`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {model.logo && (
              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06] shrink-0">
                <Image
                  src={model.logo}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white/80 truncate max-w-[130px]">
                {model.name.split(":")[0]}
              </span>
              <span className={`text-[10px] font-mono truncate max-w-[130px] ${colorClass}`}>
                {model.id.split(":").slice(-1)[0]}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isStreaming && !message ? (
              <motion.span
                key="gen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <span
                  className="relative flex h-1.5 w-1.5"
                  aria-hidden="true"
                >
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: providerColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ backgroundColor: providerColor }}
                  />
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Generating
                </span>
              </motion.span>
            ) : content ? (
              <motion.button
                key="copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="relative p-1.5 rounded-lg text-gray-600 hover:text-white/80 hover:bg-white/[0.04] transition-all shrink-0"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="px-4 py-3 min-h-[120px] flex-1">
          {!content && !isStreaming && !error && (
            <div className="flex items-center justify-center h-[120px] text-gray-700 text-sm">
              Awaiting prompt
            </div>
          )}

          {isStreaming && !content && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-600"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-700">Thinking…</span>
            </div>
          )}

          {error && !content && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <span className="text-xs text-red-400">Error: {error}</span>
            </div>
          )}

          {content && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
              {isStreaming && (
                <motion.span
                  className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              {message && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
                  <SplitFlapTime timestamp={message.timestamp} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                      title="Helpful"
                      aria-label="Mark as helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                      title="Not helpful"
                      aria-label="Mark as not helpful"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* Empty rail shown in the comparison grid before first prompt */
function EmptyRail({ model }: { model: ModelInfo }) {
  const providerColor = getProviderColor(model.id);
  const colorClass = getProviderColorClass(model.id);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="relative h-full"
    >
      <div
        className="absolute -inset-[1px] rounded-2xl blur-md opacity-15"
        style={{ background: `linear-gradient(135deg, ${providerColor}18, transparent)` }}
      />
      <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border border-dashed border-white/[0.05] bg-[#060608]/40">
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ backgroundColor: providerColor }}
        />
        <div
          className="relative flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.04]"
          style={{ background: `linear-gradient(135deg, ${providerColor}0a, transparent 60%)` }}
        >
          {model.logo && (
            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06]">
              <Image src={model.logo} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white/70 truncate max-w-[130px]">
              {model.name.split(":")[0]}
            </span>
            <span className={`text-[10px] font-mono truncate max-w-[130px] ${colorClass}`}>
              {model.id.split(":").slice(-1)[0]}
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <span className="text-[11px] text-gray-800 font-mono">
            No prompt sent yet
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Orchestrator ───────────────────────── */

export default function ChatInterface({
  sessions,
  sharedMessages,
  inputMessage,
  setInputMessage,
  isLoading,
  onSend,
  onReset,
  onAddModel,
  streamingContent = {},
  streamErrors = {},
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sharedMessages, sessions]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [inputMessage]);

  if (sessions.length === 0) {
    return <EmptyState onAddModel={onAddModel} />;
  }

  const userTurns = sharedMessages.filter((m) => m.role === "user");
  const hasPrompt = userTurns.length > 0;

  // Composer focus glow is tinted by the *selected* providers — so the box
  // visually belongs to the comparison in flight (emerald↔orange for OA+Claude, etc.)
  const providerAccents = sessions.map((s) => getProviderColor(s.model.id));
  const leftAccent = providerAccents[0] ?? "#22d3ee";
  const rightAccent = providerAccents[providerAccents.length - 1] ?? "#8b5cf6";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 playground-scroll"
        role="log"
        aria-label="Conversation"
      >
        {!hasPrompt ? (
          /* Pre-prompt: show the comparison frame empty so the layout reads as a benchmark grid */
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3"
              >
                <Columns3 className="w-7 h-7 mx-auto text-gray-800" />
                <p className="text-sm text-gray-500 font-mono">
                  Your prompt will render across every model below
                </p>
              </motion.div>
            </div>
            <div
              className={`grid gap-4 ${
                sessions.length === 1
                  ? "grid-cols-1"
                  : sessions.length === 2
                    ? "grid-cols-1 md:grid-cols-2"
                    : sessions.length === 3
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {sessions.map((session) => (
                <EmptyRail key={session.id} model={session.model} />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            {sharedMessages
              .map((msg, idx) => ({ msg, idx }))
              .filter(({ msg }) => msg.role === "user")
              .map(({ msg, idx }) => {
                const isLast = idx === userTurns.length - 1;

                return (
                  <div key={idx} className="space-y-6">
                    <UserMessageBubble message={msg} />
                    <div
                      className={`grid gap-4 items-stretch ${
                        sessions.length === 1
                          ? "grid-cols-1"
                          : sessions.length === 2
                            ? "grid-cols-1 md:grid-cols-2"
                            : sessions.length === 3
                              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              : "grid-cols-1 md:grid-cols-2"
                      }`}
                    >
                      {sessions.map((session) => {
                        const responseIndex =
                          sharedMessages
                            .slice(0, idx + 1)
                            .filter((m) => m.role === "user").length;
                        const response = session.messages[responseIndex - 1];
                        const isCurrentlyStreaming =
                          session.isTyping && !!streamingContent[session.id];

                        return (
                          <ModelResponseCard
                            key={session.id}
                            model={session.model}
                            message={response}
                            streamingContent={streamingContent[session.id] || ""}
                            isStreaming={isCurrentlyStreaming}
                            error={streamErrors[session.id]}
                          />
                        );
                      })}
                    </div>
                    {isLast && <div ref={messagesEndRef} />}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative border-t border-white/[0.04] bg-[#030305]/60 backdrop-blur-2xl shrink-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/8 to-transparent" />
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative group">
            {/* Provider-keyed focus halo — the box inherits the colors of the
                models being compared, so it never reads as a generic input. */}
            <div
              className="absolute -inset-[1.5px] rounded-2xl opacity-40 blur-[2px] transition-opacity duration-500 group-focus-within:opacity-100"
              style={{
                background: `linear-gradient(100deg, ${leftAccent}55, transparent 40%, transparent 60%, ${rightAccent}55)`,
              }}
            />
            {/* Sheen sweep that fires on hover for a premium feel */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `linear-gradient(105deg, transparent 30%, ${rightAccent}0a 50%, transparent 70%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative flex items-end gap-2 p-2 bg-gradient-to-b from-[#0c0c10]/95 to-[#08080b]/95 border border-white/[0.08] group-focus-within:border-white/[0.14] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors">
              {/* Left accent tick that lights up on focus */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full opacity-50 group-focus-within:opacity-100 transition-opacity"
                style={{ background: leftAccent }}
                aria-hidden="true"
              />
              {/* Prompt glyph */}
              <span
                className="pl-2.5 pr-1 self-center select-none text-gray-600 transition-colors group-focus-within:text-white/40"
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-60">
                  <path d="M4 5h16M4 12h10M4 19h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Ask every model at once…"
                rows={1}
                aria-label="Message"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-700 resize-none outline-none py-1.5 max-h-32 min-h-[44px]"
                disabled={isLoading}
              />
              <div className="flex items-center gap-2 pr-1">
                <AnimatePresence>
                  {inputMessage.trim().length > 0 && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="hidden sm:inline-flex items-center text-[10px] font-mono text-gray-700 overflow-hidden whitespace-nowrap"
                    >
                      {inputMessage.trim().length}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className="hidden md:flex items-center gap-1 text-[10px] font-mono text-gray-700">
                  <kbd className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] text-gray-600">
                    Enter
                  </kbd>
                  <span>↵</span>
                </span>
                <motion.button
                  type="button"
                  onClick={onSend}
                  disabled={!inputMessage.trim() || isLoading}
                  whileHover={{
                    scale: inputMessage.trim() && !isLoading ? 1.06 : 1,
                  }}
                  whileTap={{
                    scale: inputMessage.trim() && !isLoading ? 0.94 : 1,
                  }}
                  className="relative p-2.5 rounded-xl text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all overflow-hidden shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${leftAccent}, ${rightAccent})`,
                    boxShadow: inputMessage.trim()
                      ? `0 0 24px ${rightAccent}55, 0 0 8px ${leftAccent}40`
                      : "none",
                  }}
                  aria-label="Send message"
                  title="Send (Enter)"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.18] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                  ) : (
                    <Send className="w-4 h-4 relative z-10" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-800 text-center mt-2 font-mono">
            Responses may be inaccurate. Verify critical information.
          </p>
        </div>
      </div>
    </div>
  );
}
