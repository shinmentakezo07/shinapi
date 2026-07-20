"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Edit3,
  Layers,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ChatSession,
  EnrichedModel,
  HistoryChat,
  Message,
} from "@/components/playground/types";
import ChatInterface from "@/components/playground/ChatInterface";
import ModelSelector from "@/components/playground/ModelSelector";
import { getProviderColor } from "@/components/playground/ProviderColors";
import { useModelCatalog } from "@/lib/api/hooks";
import { mapCatalogToEnriched } from "@/lib/api/model-catalog";
import { ChatMessage, configureSDK, getSDK } from "@/lib/api/sdk";

const HISTORY_KEY = "yapapa.playground.history.v1";
const ACTIVE_KEY = "yapapa.playground.active.v1";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
  modelId: z.string().optional(),
});

const EnrichedModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable().optional(),
  provider: z.string(),
  context_length: z.number().optional(),
  pricing: z
    .object({
      prompt: z.string().optional(),
      completion: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
});

const ChatSessionSchema = z.object({
  id: z.string(),
  model: EnrichedModelSchema,
  messages: z.array(MessageSchema),
  isTyping: z.boolean(),
});

const HistoryChatSchema = z.object({
  id: z.string(),
  title: z.string(),
  sharedMessages: z.array(MessageSchema),
  sessions: z.array(ChatSessionSchema),
  selectedModels: z.array(EnrichedModelSchema),
  updatedAt: z.number(),
});

function deriveTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  const raw = first?.content || "New Chat";
  return raw.length > 40 ? `${raw.slice(0, 40)}…` : raw;
}

export default function PlaygroundPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const sessionsRef = useRef<ChatSession[]>(sessions);
  const [selectedModels, setSelectedModels] = useState<EnrichedModel[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(isLoading);
  const [sharedMessages, setSharedMessages] = useState<Message[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatHistory, setChatHistory] = useState<HistoryChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [streamingContent, setStreamingContent] = useState<
    Record<string, string>
  >({});
  const [streamErrors, setStreamErrors] = useState<Record<string, string>>({});

  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
  } = useModelCatalog();
  const allModels = mapCatalogToEnriched(catalog ?? []);

  useEffect(() => {
    setIsMounted(true);
    configureSDK({
      baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    });
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (savedHistory) {
      try {
        const raw = JSON.parse(savedHistory);
        const parsed = z.array(HistoryChatSchema).safeParse(raw);
        if (parsed.success) {
          const history = parsed.data;
          setChatHistory(history);
          if (savedActive && history.some((c) => c.id === savedActive)) {
            setActiveChatId(savedActive);
            const chat = history.find((c) => c.id === savedActive)!;
            setSharedMessages(chat.sharedMessages);
            setSessions(chat.sessions.map((s) => ({ ...s, isTyping: false })));
            setSelectedModels(chat.selectedModels);
          }
        }
      } catch {
        // ignore corrupt history
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(ACTIVE_KEY, activeChatId || "");
  }, [activeChatId, isMounted]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const saveCurrentChat = useCallback(() => {
    if (sharedMessages.length === 0) return;
    const title = deriveTitle(sharedMessages);
    const chat: HistoryChat = {
      id:
        activeChatId ||
        `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      sharedMessages,
      sessions: sessions.map((s) => ({ ...s, isTyping: false })),
      selectedModels,
      updatedAt: Date.now(),
    };
    setChatHistory((prev) => {
      const filtered = prev.filter((c) => c.id !== chat.id);
      return [chat, ...filtered].slice(0, 50);
    });
    return chat.id;
  }, [sharedMessages, activeChatId, sessions, selectedModels]);

  const handleNewChat = useCallback(() => {
    if (sharedMessages.length > 0) {
      saveCurrentChat();
    }
    setSharedMessages([]);
    setSessions([]);
    setSelectedModels([]);
    const newId = `chat_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    setActiveChatId(newId);
  }, [sharedMessages, saveCurrentChat]);

  const handleLoadChat = useCallback(
    (chat: HistoryChat) => {
      if (chat.id === activeChatId) return;
      if (sharedMessages.length > 0) {
        saveCurrentChat();
      }
      setActiveChatId(chat.id);
      setSharedMessages(chat.sharedMessages);
      setSessions(chat.sessions.map((s) => ({ ...s, isTyping: false })));
      setSelectedModels(chat.selectedModels);
    },
    [activeChatId, sharedMessages, saveCurrentChat],
  );

  const handleDeleteChat = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setChatHistory((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
        setSharedMessages([]);
        setSessions([]);
        setSelectedModels([]);
      }
    },
    [activeChatId],
  );

  const confirmModels = useCallback((models: EnrichedModel[]) => {
    setSelectedModels(models);
    setSessions((prevSessions) => {
      const newSessions: ChatSession[] = models.map((model) => {
        const existing = prevSessions.find((s) => s.id === model.id);
        if (existing) return { ...existing, model };
        return { id: model.id, model, messages: [], isTyping: false };
      });
      return newSessions;
    });
    setShowModelSelector(false);
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => prev.filter((m) => m.id !== modelId));
    setSessions((prev) => prev.filter((s) => s.id !== modelId));
  }, []);

  const resetChat = useCallback(() => {
    if (sharedMessages.length > 0) {
      saveCurrentChat();
    }
    setSharedMessages([]);
    setSessions((prev) =>
      prev.map((s) => ({ ...s, messages: [], isTyping: false })),
    );
  }, [sharedMessages, saveCurrentChat]);

  const sendMessage = useCallback(async () => {
    if (
      !inputMessage.trim() ||
      selectedModels.length === 0 ||
      isLoadingRef.current
    )
      return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    setSharedMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setStreamErrors({});
    setStreamingContent({});

    setSessions((prev) => prev.map((s) => ({ ...s, isTyping: true })));

    const promises = selectedModels.map(async (model) => {
      const currentSessions = sessionsRef.current;
      const targetSession = currentSessions.find((s) => s.id === model.id);
      const priorMessages = targetSession
        ? targetSession.messages.filter(
            (m) => m.role === "user" || m.role === "assistant",
          )
        : sharedMessages.filter(
            (m) => m.role === "user" || m.role === "assistant",
          );
      const messages: ChatMessage[] = priorMessages
        .map((m) => ({ role: m.role, content: m.content }))
        .concat({ role: "user", content: inputMessage });

      try {
        const stream = getSDK().chatStream({ model: model.id, messages });
        let accumulated = "";

        for await (const chunk of stream) {
          accumulated += chunk;
          setStreamingContent((prev) => ({ ...prev, [model.id]: accumulated }));
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: accumulated,
          timestamp: Date.now(),
          modelId: model.id,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === model.id
              ? {
                  ...s,
                  messages: [...s.messages, assistantMessage],
                  isTyping: false,
                }
              : s,
          ),
        );
        setStreamingContent((prev) => {
          const next = { ...prev };
          delete next[model.id];
          return next;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setStreamErrors((prev) => ({ ...prev, [model.id]: errorMessage }));
        setSessions((prev) =>
          prev.map((s) => (s.id === model.id ? { ...s, isTyping: false } : s)),
        );
        setStreamingContent((prev) => {
          const next = { ...prev };
          delete next[model.id];
          return next;
        });
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  }, [inputMessage, selectedModels]);

  if (!isMounted) return null;

  return (
    <div className="h-screen bg-[#0a0a0b] text-white relative overflow-hidden flex">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative z-20 flex flex-col border-r border-white/[0.06] bg-[#0d0d0f] overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/[0.08]">
                  <Image
                    src="/nervous-cat.jpg"
                    alt="Yapapa"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <span className="font-semibold text-sm tracking-tight">
                    Yapapa
                  </span>
                  <span className="text-[9px] text-gray-500 block font-mono">
                    Playground
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                aria-label="Hide sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* New Chat */}
            <div className="px-3 py-3">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/[0.12] text-sm font-medium transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-2 pb-3 playground-scroll">
              <div className="space-y-0.5">
                {chatHistory.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleLoadChat(chat)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-white/80"
                            : "text-gray-600 group-hover:text-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs truncate ${
                            isActive
                              ? "text-white/90 font-medium"
                              : "text-gray-400 group-hover:text-gray-300"
                          }`}
                        >
                          {chat.title}
                        </div>
                        <div className="text-[10px] text-gray-600 font-mono truncate">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {chatHistory.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-7 h-7 mx-auto mb-3 text-gray-700" />
                    <p className="text-xs text-gray-600 font-mono">
                      No chats yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle */}
      <AnimatePresence>
        {!showSidebar && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 left-4 z-30 p-2 rounded-lg bg-[#15151a] border border-white/[0.08] hover:border-white/[0.16] transition-colors"
            aria-label="Show sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-white/[0.06] bg-[#0d0d0f] shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div
                className={`flex items-center gap-4 ${!showSidebar ? "ml-14 md:ml-0" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/[0.08]">
                    <Image
                      src="/nervous-cat.jpg"
                      alt="Yapapa"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-base font-semibold tracking-tight text-white/90">
                      Playground
                    </h1>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 font-mono">
                        {sessions.length > 0
                          ? `${sessions.length} model${sessions.length > 1 ? "s" : ""} live`
                          : "Compare Models"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Model Pills + Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {selectedModels.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 max-w-md overflow-hidden">
                    <AnimatePresence mode="popLayout">
                      {selectedModels.map((model) => (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                          className="group flex items-center gap-2 pl-2 pr-1.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-full transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: getProviderColor(model.id),
                            }}
                          />
                          <span className="text-[11px] font-medium text-white/80 truncate max-w-[100px]">
                            {model.name.split(":")[0]}
                          </span>
                          <button
                            onClick={() => removeModel(model.id)}
                            className="p-0.5 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Remove model"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Mobile model count */}
                {selectedModels.length > 0 && (
                  <div className="sm:hidden flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/70">
                    <span className="text-emerald-400">●</span>
                    {selectedModels.length}
                  </div>
                )}

                <AnimatePresence>
                  {sharedMessages.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={resetChat}
                      className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.16] text-gray-400 hover:text-white transition-colors shrink-0"
                      aria-label="Clear conversation"
                      title="Clear conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setShowModelSelector(true)}
                  className="relative px-3 sm:px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shrink-0"
                >
                  {selectedModels.length > 0 ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {selectedModels.length > 0 ? "Manage Models" : "Add Models"}
                  </span>
                  <span className="sm:hidden">
                    {selectedModels.length > 0 ? "Manage" : "Add"}
                  </span>
                  {selectedModels.length > 0 && (
                    <span className="ml-0.5 text-[10px] font-bold opacity-60">
                      {selectedModels.length}/4
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty catalog notice */}
        {!catalogLoading && !catalogError && allModels.length === 0 && (
          <div className="mx-4 sm:mx-6 mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
            <p className="text-sm text-white/80 font-medium mb-1">
              No models configured
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Ask an admin to add a provider (endpoint, API key, and model IDs)
              under Admin → Providers. The catalog is shared with the models
              page.
            </p>
          </div>
        )}
        {catalogLoading && allModels.length === 0 && (
          <div className="mx-4 sm:mx-6 py-10 space-y-3" aria-busy="true" aria-live="polite" aria-label="Loading model catalog">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="h-14 rounded-xl bg-white/[0.04] animate-pulse motion-reduce:animate-none"
                style={{ width: `${95 - i * 5}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}

        {/* Chat Area */}
        <ChatInterface
          sessions={sessions}
          sharedMessages={sharedMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isLoading={isLoading}
          onSend={sendMessage}
          onReset={resetChat}
          onAddModel={() => setShowModelSelector(true)}
          streamingContent={streamingContent}
          streamErrors={streamErrors}
        />
      </div>

      {/* Model Selector Modal */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        models={allModels}
        selectedModels={selectedModels}
        onConfirm={confirmModels}
      />
    </div>
  );
}
