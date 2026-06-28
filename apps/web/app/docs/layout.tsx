"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Book,
  Zap,
  Key,
  Code2,
  MessageSquare,
  Database,
  Boxes,
  FileText,
  Layers,
  UploadCloud,
  Shield,
  AlertTriangle,
  Cpu,
  TrendingUp,
  BarChart3,
  Lock,
  Terminal,
  Search,
  Users,
  Webhook,
  X,
  ChevronRight,
  ArrowUpRight,
  Globe,
} from "lucide-react";
import { ScrollProgress } from "@/components/docs/ScrollProgress";
import { SearchModal } from "@/components/docs/SearchModal";
import { DocsNavbar } from "@/components/docs/DocsNavbar";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import type { NavItem } from "@/components/docs/types";

/* ── Single indigo accent system ── */
const ACCENT = {
  text: "text-indigo-200",
  bg: "bg-indigo-500/[0.06]",
  border: "border-indigo-500/15",
  ring: "ring-indigo-500/20",
  gradient: "from-indigo-500/20",
  glow: "shadow-indigo-500/10",
};

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Getting Started",
    items: [
      { id: "quickstart", label: "Quick Start", icon: Zap },
      { id: "authentication", label: "Authentication", icon: Key },
      { id: "api-reference", label: "API Reference", icon: Code2 },
      { id: "self-hosting", label: "Self-Hosting", icon: Globe },
    ],
  },
  {
    label: "Core Features",
    items: [
      { id: "chat", label: "Chat & Streaming", icon: MessageSquare },
      { id: "embeddings", label: "Embeddings", icon: Database },
      { id: "conversations", label: "Conversations", icon: Boxes },
      { id: "prompts", label: "Prompt Templates", icon: FileText },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "batch", label: "Batch API", icon: Layers },
      { id: "files", label: "File Upload", icon: UploadCloud },
      { id: "webhooks", label: "Webhooks", icon: Webhook },
      { id: "rate-limits", label: "Rate Limits", icon: Shield },
      { id: "error-handling", label: "Error Handling", icon: AlertTriangle },
      { id: "organizations", label: "Organizations", icon: Users },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "models", label: "Available Models", icon: Cpu },
      { id: "pricing", label: "Pricing & Credits", icon: TrendingUp },
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "security", label: "Security", icon: Lock },
      { id: "examples", label: "Code Examples", icon: Terminal },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState("");

  const currentSectionId =
    pathname.replace("/docs/", "").replace("/", "") || "index";
  const currentItem = allNavItems.find((i) => i.id === currentSectionId);

  const filteredNavGroups = sidebarFilter
    ? navGroups
        .map((g) => ({
          ...g,
          items: g.items.filter((i) =>
            i.label.toLowerCase().includes(sidebarFilter.toLowerCase()),
          ),
        }))
        .filter((g) => g.items.length > 0)
    : navGroups;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigateTo = useCallback(
    (id: string) => {
      router.push(`/docs/${id}`);
      setSearchOpen(false);
      setSidebarOpen(false);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-[#06060a] text-foreground relative selection:bg-indigo-500/25 selection:text-white">
      <ScrollProgress />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={allNavItems}
        onNavigate={navigateTo}
      />

      <DocsNavbar
        onSearchOpen={() => setSearchOpen(true)}
        onMobileMenuClick={() => setSidebarOpen(true)}
        currentSectionLabel={currentItem?.label}
      />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#08080b]/97 backdrop-blur-2xl border-l border-white/[0.07] lg:hidden overflow-y-auto"
          >
            <SidebarContent
              mobile
              onClose={() => setSidebarOpen(false)}
              navGroups={filteredNavGroups}
              filter={sidebarFilter}
              setFilter={setSidebarFilter}
              currentSectionId={currentSectionId}
              navigateTo={navigateTo}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-[58px] bottom-0 w-[260px] border-r border-white/[0.07] bg-[#06060a]/85 backdrop-blur-xl z-20">
        <SidebarContent
          navGroups={filteredNavGroups}
          filter={sidebarFilter}
          setFilter={setSidebarFilter}
          currentSectionId={currentSectionId}
          navigateTo={navigateTo}
        />
      </aside>

      {/* Main content */}
      <div className="lg:ml-[260px] relative z-10">
        <main className="max-w-[800px] mx-auto px-6 sm:px-10 pt-[80px] pb-20">
          <DocsPageShell>{children}</DocsPageShell>
        </main>
      </div>
    </div>
  );
}

/* ── Sidebar content (shared between mobile + desktop) ── */

function SidebarContent({
  mobile,
  onClose,
  navGroups,
  filter,
  setFilter,
  currentSectionId,
  navigateTo,
}: {
  mobile?: boolean;
  onClose?: () => void;
  navGroups: NavGroup[];
  filter?: string;
  setFilter: (v: string) => void;
  currentSectionId: string;
  navigateTo: (id: string) => void;
}) {
  const totalItems = navGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="flex flex-col h-full docs-sidebar">
      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.06] overflow-hidden">
        {/* ambient glow */}
        <div
          className="absolute -top-8 -left-6 w-28 h-28 rounded-full opacity-50 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)",
          }}
        />
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl ${ACCENT.bg} border ${ACCENT.border} flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_12px_-4px_rgba(99,102,241,0.35)]`}
            >
              <Book className={`w-[15px] h-[15px] ${ACCENT.text}`} />
            </div>
            {/* pulsing dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)] animate-pulse" />
          </div>
          <div className="leading-tight">
            <span className="text-[13px] font-semibold text-white/85 block">
              Documentation
            </span>
            <span className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-[3px] bg-indigo-500/[0.08] border border-indigo-500/20">
                <span className="w-1 h-1 rounded-full bg-indigo-300" />
                <span className="text-[9px] font-mono font-semibold tracking-[0.08em] text-indigo-200/80">
                  v1.0
                </span>
              </span>
              <span className="text-[9px] font-mono text-white/25 tracking-[0.08em]">
                {totalItems} pages
              </span>
            </span>
          </div>
        </div>
        {mobile && onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Filter ── */}
      <div className="px-4 pt-3">
        <div className="relative group">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-indigo-200/70 transition-colors duration-200`}
          />
          <input
            type="text"
            placeholder="Filter pages..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter documentation pages"
            className="w-full bg-white/[0.025] border border-white/[0.07] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white/65 placeholder:text-white/25 font-mono outline-none focus:border-indigo-500/35 focus:bg-indigo-500/[0.05] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-150 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {!filter && (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center px-1.5 py-[2px] rounded-[4px] bg-white/[0.04] border border-white/[0.05] text-[9px] font-mono text-white/20 leading-none pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Nav groups ── */}
      <nav
        className="flex-1 overflow-y-auto py-3 docs-scroll"
        role="navigation"
        aria-label="Documentation navigation"
      >
        {navGroups.length > 0 ? (
          navGroups.map((group, gi) => {
            return (
              <div key={group.label} className={gi > 0 ? "mt-1" : ""}>
                <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-indigo-200/55">
                    {group.label}
                  </span>
                  <span className="text-[9px] font-mono text-white/20">
                    {group.items.length}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/15 to-transparent" />
                </div>
                <div className="space-y-px px-2">
                  {group.items.map((item) => {
                    const isActive = currentSectionId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-3 px-3 py-[10px] rounded-xl text-sm w-full text-left transition-all duration-200 cursor-pointer group ${
                          isActive
                            ? `text-white bg-indigo-500/[0.09] border border-indigo-500/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_4px_16px_-6px_rgba(99,102,241,0.45)]`
                            : "text-white/40 hover:text-white/75 hover:bg-white/[0.045] hover:border-white/[0.06] border border-transparent"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-indigo-300 to-indigo-400 shadow-[0_0_10px_rgba(165,180,252,0.8)]"
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                            }}
                          />
                        )}
                        <item.icon
                          className={`w-[14px] h-[14px] flex-shrink-0 transition-all duration-200 ${
                            isActive
                              ? "text-indigo-200 drop-shadow-[0_0_4px_rgba(165,180,252,0.5)]"
                              : "text-white/25 group-hover:text-white/50 group-hover:scale-110"
                          }`}
                        />
                        <span className="truncate text-[13px] font-medium">
                          {item.label}
                        </span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-indigo-200/60 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 px-4">
            <Search className="w-5 h-5 text-white/15" />
            <span className="text-xs text-white/25 font-mono text-center">
              No pages match
              <br />
              <span className="text-white/40">&ldquo;{filter}&rdquo;</span>
            </span>
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-3 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-1.5">
          <a
            href="https://github.com/shinmentakezo07/owsiwa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
          >
            <svg
              className="w-3.5 h-3.5 group-hover:text-indigo-200/70 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 1.753.986A6.028 6.028 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404.912-1.255 1.753-.986 1.753-.986.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span>Source</span>
            <ArrowUpRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>
          <a
            href="https://github.com/shinmentakezo07/owsiwa/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-mono text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
            aria-label="Report an issue"
          >
            <AlertTriangle className="w-3 h-3 group-hover:text-amber-200/70 transition-colors" />
          </a>
        </div>
        {/* status line */}
        <div className="flex items-center justify-center gap-1.5 mt-2 px-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 animate-ping opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25">
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
}
