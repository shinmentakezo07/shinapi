"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Gauge,
  Loader2,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChatSession, EnrichedModel, Message } from "./types";
import { getProviderColor, getProviderColorClass } from "./ProviderColors";

type ModelInfo = EnrichedModel;

const HUMAN_ACCENT = "#F5B14A";

function formatContext(ctx?: number): string {
  if (!ctx || ctx <= 0) return "—";
  if (ctx >= 1_000_000)
    return `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 ? 1 : 0)}M`;
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}K`;
  return String(ctx);
}

function formatPrice(p?: string): string {
  if (!p) return "—";
  const n = Number(p);
  if (Number.isNaN(n)) return "—";
  if (n === 0) return "free";
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  if (n >= 0.0001) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(1)}`;
}

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
  const suggestions = [
    "Create a landing page",
    "Build a dashboard",
    "Write a poem",
    "Explain a concept",
  ];
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-6 h-6 text-white/60" />
        </div>
        <h2
          className="text-2xl sm:text-3xl text-white/95 tracking-tight mb-3 text-balance"
          style={{
            fontFamily: "var(--font-instrument), ui-serif, Georgia, serif",
          }}
        >
          Compare models side by side
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Pick two or more models and send one prompt. See how each one
          responds, side by side.
        </p>
        <button
          onClick={onAddModel}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-white/90 rounded-lg font-semibold text-sm transition-colors"
        >
          Select Models to Start
        </button>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <span
              key={s}
              className="text-xs text-gray-500 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── User bubble ───────────────────────── */

function UserMessageBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end mb-5">
      <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        <div
          className="px-4 py-3 bg-[#15151a] rounded-xl rounded-tr-sm border border-white/[0.06]"
          style={{ boxShadow: `inset 2px 0 0 ${HUMAN_ACCENT}` }}
        >
          <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
          <span className="block text-[10px] text-gray-600 font-mono mt-1.5 text-right tabular-nums">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Model response column ─────────────────────── */

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
  const streamStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStreaming && streamStartRef.current === null) {
      streamStartRef.current = Date.now();
    }
    if (!isStreaming && message) {
      streamStartRef.current = null;
    }
  }, [isStreaming, message]);

  const elapsed =
    message && streamStartRef.current === null
      ? null
      : streamStartRef.current
        ? Math.max(0, Date.now() - streamStartRef.current)
        : null;

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const providerColor = getProviderColor(model.id);
  const colorClass = getProviderColorClass(model.id);

  const approxTokens = content
    ? Math.max(1, Math.round(content.length / 4))
    : 0;

  return (
    <div className="relative group h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0d0f]">
      {/* Provider accent rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ backgroundColor: providerColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          {model.logo && (
            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.08] shrink-0">
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
            <span className="text-xs font-semibold text-white/90 truncate max-w-[140px] leading-tight">
              {model.name.split(":")[0]}
            </span>
            <span
              className={`text-[10px] font-mono truncate max-w-[140px] ${colorClass} leading-tight`}
            >
              {model.id.split(":").slice(-1)[0]}
            </span>
          </div>
        </div>

        {/* Spec strip */}
        <div className="hidden md:flex items-center gap-2 mr-1 shrink-0">
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-gray-500"
            title="Context window"
          >
            <Gauge className="w-3 h-3 text-gray-600" />
            <span className="tabular-nums">
              {formatContext(model.context_length)}
            </span>
          </span>
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
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: providerColor }}
              />
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
              onClick={handleCopy}
              className="relative p-1.5 rounded-lg text-gray-500 hover:text-white/90 hover:bg-white/[0.06] transition-colors shrink-0"
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
            <div className="flex gap-1">
              {[0, 0.15, 0.3].map((delay, i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-gray-600 animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 font-mono">Thinking…</span>
            <span className="text-[10px] text-gray-700 font-mono tabular-nums ml-auto">
              {streamingContent.length} ch
            </span>
          </div>
        )}

        {error && !content && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <span className="text-xs text-red-400">Error: {error}</span>
          </div>
        )}

        {content && (
          <div>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              {content}
              {isStreaming && (
                <span
                  className="inline-block w-[2px] h-4 ml-0.5 align-middle rounded-full animate-pulse"
                  style={{ backgroundColor: providerColor }}
                />
              )}
            </p>
            {message && (
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-gray-600 font-mono tabular-nums">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {approxTokens > 0 && (
                    <span className="text-[10px] font-mono text-gray-700 tabular-nums">
                      ~{approxTokens.toLocaleString()} tok
                    </span>
                  )}
                  {elapsed !== null && (
                    <span
                      className="text-[10px] font-mono tabular-nums"
                      style={{ color: providerColor }}
                    >
                      {(elapsed / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
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
          </div>
        )}
      </div>
    </div>
  );
}

/* Empty rail shown before first prompt */
function EmptyRail({ model }: { model: ModelInfo }) {
  const providerColor = getProviderColor(model.id);
  const colorClass = getProviderColorClass(model.id);
  return (
    <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-dashed border-white/[0.06] bg-[#0d0d0f]/60">
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ backgroundColor: providerColor }}
      />
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.06]">
        {model.logo && (
          <div className="relative w-5 h-5 rounded-full overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.08]">
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
          <span className="text-xs font-semibold text-white/80 truncate max-w-[140px] leading-tight">
            {model.name.split(":")[0]}
          </span>
          <span
            className={`text-[10px] font-mono truncate max-w-[140px] ${colorClass} leading-tight`}
          >
            {model.id.split(":").slice(-1)[0]}
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center gap-2">
        {model.description ? (
          <p className="text-[11px] text-gray-600 leading-relaxed max-w-[34ch] line-clamp-3">
            {model.description}
          </p>
        ) : null}
        <span className="text-[10px] text-gray-700 font-mono uppercase tracking-[0.12em]">
          Awaiting first turn
        </span>
      </div>
    </div>
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

  const providerAccents = sessions.map((s) => getProviderColor(s.model.id));
  const leftAccent = providerAccents[0] ?? "#22d3ee";
  const rightAccent = providerAccents[providerAccents.length - 1] ?? "#8b5cf6";

  const gridClass =
    sessions.length === 1
      ? "grid-cols-1"
      : sessions.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : sessions.length === 3
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 playground-scroll"
        role="log"
        aria-label="Conversation"
      >
        {!hasPrompt ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500 font-mono">
                  Your prompt will render across every model below
                </p>
              </div>
            </div>
            <div className={`grid gap-4 ${gridClass}`}>
              {sessions.map((session) => (
                <EmptyRail key={session.id} model={session.model} />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-10">
            {sharedMessages
              .map((msg, idx) => ({ msg, idx }))
              .filter(({ msg }) => msg.role === "user")
              .map(({ msg, idx }, turnOrdinal) => {
                const isLast = turnOrdinal === userTurns.length - 1;
                const turnLabel = `T${turnOrdinal + 1}`;

                return (
                  <div key={idx} className="relative space-y-4 pl-7 sm:pl-9">
                    {/* Alignment rail */}
                    <div
                      className="absolute left-[7px] sm:left-[11px] top-0 bottom-0 w-px"
                      style={{
                        background: `linear-gradient(to bottom, ${HUMAN_ACCENT}50, ${HUMAN_ACCENT}18 ${
                          isLast ? "90%" : "100%"
                        }, transparent)`,
                      }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute left-0 sm:left-1 top-0 hidden sm:flex items-center justify-center w-[22px] h-[22px] rounded-full text-[9px] font-mono font-bold tabular-nums z-10"
                      style={{
                        backgroundColor: `${HUMAN_ACCENT}1a`,
                        border: `1px solid ${HUMAN_ACCENT}55`,
                        color: HUMAN_ACCENT,
                      }}
                      aria-hidden="true"
                    >
                      {turnOrdinal + 1}
                    </div>
                    <div
                      className="sm:hidden absolute left-0 top-0 text-[8px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${HUMAN_ACCENT}1a`,
                        border: `1px solid ${HUMAN_ACCENT}40`,
                        color: HUMAN_ACCENT,
                      }}
                      aria-hidden="true"
                    >
                      {turnLabel}
                    </div>

                    <UserMessageBubble message={msg} />
                    <div className={`grid gap-4 items-stretch ${gridClass}`}>
                      {sessions.map((session) => {
                        const responseIndex = sharedMessages
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
                            streamingContent={
                              streamingContent[session.id] || ""
                            }
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
      <div className="border-t border-white/[0.06] bg-[#0d0d0f] shrink-0">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative group">
            <div className="relative flex items-end gap-2 p-2 bg-[#15151a] border border-white/[0.08] group-focus-within:border-white/[0.16] rounded-xl transition-colors">
              {/* Left accent tick */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full opacity-50 group-focus-within:opacity-100 transition-opacity"
                style={{ background: leftAccent }}
                aria-hidden="true"
              />
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
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 resize-none outline-none py-1.5 max-h-32 min-h-[44px]"
                disabled={isLoading}
              />
              {/* Destination badge */}
              <div className="hidden sm:flex items-center gap-1.5 pr-1 pl-2 border-l border-white/[0.06] self-center shrink-0">
                <span className="text-[10px] font-mono text-gray-600 whitespace-nowrap">
                  →
                </span>
                <div className="flex items-center -space-x-1">
                  {providerAccents.map((c, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full ring-2 ring-[#15151a]"
                      style={{ backgroundColor: c }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap tabular-nums">
                  {sessions.length}
                  <span className="text-gray-700 ml-1">
                    model{sessions.length > 1 ? "s" : ""}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 pr-1 shrink-0">
                <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-gray-600">
                  <kbd className="px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-gray-500">
                    ↵
                  </kbd>
                </span>
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!inputMessage.trim() || isLoading}
                  className="relative p-2.5 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${leftAccent}, ${rightAccent})`,
                  }}
                  aria-label="Send message"
                  title="Send (Enter)"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-[10px] text-gray-700 font-mono">
              Responses may be inaccurate. Verify critical information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
