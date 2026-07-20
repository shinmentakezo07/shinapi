"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Menu,
  BookOpen,
  ChevronDown,
  Sparkles,
  Activity,
  Rocket,
  Building2,
  Mail,
  Newspaper,
  Scale,
  ArrowUpRight,
  FileText,
  Library,
  Command,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DocsNavbarProps {
  onSearchOpen: () => void;
  onMobileMenuClick: () => void;
  currentSectionLabel?: string;
}

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 1.753.986A6.028 6.028 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404.912-1.255 1.753-.986 1.753-.986.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const productLinks = [
  { label: "Models", href: "/models", desc: "Browse 100+ AI models" },
  { label: "Playground", href: "/playground", desc: "Test models in-browser" },
  { label: "Pricing", href: "/pricing", desc: "Credit-based billing" },
  { label: "Dashboard", href: "/dashboard", desc: "Usage analytics & keys" },
];

const resourcesLinks = [
  {
    label: "Changelog",
    href: "/changelog",
    desc: "Every release, every fix",
    icon: FileText,
  },
  {
    label: "Blog",
    href: "/blog",
    desc: "Engineering deep dives",
    icon: Newspaper,
  },
  {
    label: "Status",
    href: "/status",
    desc: "Live system availability",
    icon: Activity,
  },
  {
    label: "Roadmap",
    href: "/roadmap",
    desc: "What we're building next",
    icon: Rocket,
  },
  {
    label: "About",
    href: "/about",
    desc: "Our team, story, investors",
    icon: Building2,
  },
  {
    label: "Enterprise",
    href: "/enterprise",
    desc: "Dedicated, compliant, 24/7",
    icon: Sparkles,
  },
  { label: "Contact", href: "/contact", desc: "Talk to a human", icon: Mail },
  {
    label: "Legal",
    href: "/legal",
    desc: "Terms, privacy, cookies",
    icon: Scale,
  },
];

export function DocsNavbar({
  onSearchOpen,
  onMobileMenuClick,
  currentSectionLabel,
}: DocsNavbarProps) {
  const [productOpen, setProductOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(0);
  const productRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      setTime(t / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!productOpen && !resourcesOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (productRef.current && !productRef.current.contains(target)) {
        setProductOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(target)) {
        setResourcesOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProductOpen(false);
        setResourcesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [productOpen, resourcesOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* ── Animated gradient accent strip with traveling light ── */}
      <div className="relative h-[2px] w-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(99,102,241,0) 0%, rgba(99,102,241,0.85) 25%, rgba(165,180,252,1) 50%, rgba(34,211,238,0.85) 75%, rgba(34,211,238,0) 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "200% 50%"],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-0 blur-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(165,180,252,0.7) 50%, transparent 100%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
        {/* Subtle bottom glow */}
        <div
          className="absolute inset-x-0 -bottom-3 h-3 blur-md opacity-70"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(165,180,252,0.45), transparent)",
          }}
        />
      </div>

      {/* ── Navbar body ── */}
      <motion.div
        className="pointer-events-auto"
        initial={false}
        animate={{
          height: scrolled ? 58 : 64,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backdropFilter: scrolled
            ? "blur(24px) saturate(180%)"
            : "blur(14px) saturate(140%)",
          WebkitBackdropFilter: scrolled
            ? "blur(24px) saturate(180%)"
            : "blur(14px) saturate(140%)",
        }}
      >
        <div
          className={`h-full w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? "bg-[#06060a]/85 border-b border-indigo-500/10 shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_40px_-12px_rgba(99,102,241,0.18),0_4px_24px_rgba(0,0,0,0.55)]"
              : "bg-[#06060a]/40 border-b border-transparent"
          }`}
        >
          {/* Animated aurora backplate (subtle) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.55]"
            aria-hidden
          >
            <motion.div
              className="absolute -top-20 -left-20 w-[420px] h-[120px] rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(99,102,241,0.22), transparent 70%)",
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, 8, 0],
              }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -top-16 right-1/4 w-[300px] h-[100px] rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(34,211,238,0.16), transparent 70%)",
              }}
              animate={{
                x: [0, -20, 0],
                y: [0, 6, 0],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <header className="relative mx-auto max-w-6xl flex items-center h-full px-4 sm:px-6">
            {/* ── Left cluster ── */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onMobileMenuClick}
                aria-label="Open navigation"
                className="relative lg:hidden p-2 -ml-1 text-white/40 hover:text-white/85 rounded-xl hover:bg-white/[0.06] transition-all duration-200 cursor-pointer group/menu"
              >
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.04] group-hover/menu:ring-indigo-500/30 transition-all duration-300" />
                <span className="absolute -inset-1 rounded-2xl bg-indigo-500/0 group-hover/menu:bg-indigo-500/10 blur-md transition-all duration-300" />
                <Menu className="w-[18px] h-[18px] relative z-10" />
              </button>

              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2.5 group flex-shrink-0"
              >
                <div className="relative w-9 h-9 rounded-[10px] bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center group-hover:border-indigo-500/40 transition-all duration-500 group-hover:shadow-[0_0_22px_-2px_rgba(99,102,241,0.55)]">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:6px_6px]" />
                  {/* Orbiting ring around the icon */}
                  <motion.div
                    className="absolute inset-[-3px] rounded-[12px] pointer-events-none"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0deg, rgba(165,180,252,0.55) 60deg, transparent 120deg, transparent 360deg)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <div className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_14px_-3px_rgba(165,180,252,0.35)]" />
                  <Image
                    src="/nervous-cat.jpg"
                    alt="Yapapa"
                    width={26}
                    height={26}
                    className="rounded-[6px] object-cover relative z-10"
                  />
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[15px] font-extrabold tracking-[-0.04em] text-white/80 group-hover:text-white transition-colors duration-300 leading-none"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    YAPAPA
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <motion.span
                      className="hidden sm:block h-[1px] bg-gradient-to-r from-indigo-300/60 via-cyan-300/60 to-transparent"
                      initial={{ width: 0 }}
                      animate={{ width: scrolled ? 28 : 36 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <span className="hidden sm:block text-[8px] font-mono uppercase tracking-[0.2em] text-white/[0.18] group-hover:text-indigo-200/70 transition-colors duration-300">
                      LLM Gateway
                    </span>
                  </div>
                </div>
              </Link>

              <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-white/[0.10] to-transparent" />

              {/* Section indicator — gradient pill with shimmer + breadcrumb */}
              <div className="hidden sm:flex items-center gap-2">
                <motion.div
                  className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-500/25 bg-gradient-to-r from-indigo-500/[0.10] via-indigo-500/[0.06] to-transparent overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 24 }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatDelay: 5,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] pointer-events-none" />
                  <BookOpen className="w-3 h-3 text-indigo-200 relative z-10 drop-shadow-[0_0_4px_rgba(165,180,252,0.6)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200/85 relative z-10">
                    Docs
                  </span>
                </motion.div>

                {currentSectionLabel && (
                  <>
                    <span className="text-white/[0.10] text-[11px] font-light select-none">
                      /
                    </span>
                    <motion.span
                      key={currentSectionLabel}
                      initial={{ opacity: 0, x: -6, filter: "blur(4px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: 4, filter: "blur(4px)" }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="relative text-[12px] font-medium text-white/65 truncate max-w-[160px]"
                    >
                      {currentSectionLabel}
                    </motion.span>
                  </>
                )}
              </div>
            </div>

            {/* ── Right cluster ── */}
            <div className="flex items-center gap-1.5 ml-auto">
              <nav
                className="hidden lg:flex items-center mr-1"
                aria-label="Platform navigation"
              >
                {productLinks.slice(0, 3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/40 hover:text-white/80 transition-all duration-200 cursor-pointer group"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <div className="absolute inset-0 rounded-lg bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="absolute bottom-0.5 left-3 right-3 h-px origin-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] scale-x-0 group-hover:scale-x-100 bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />
                  </Link>
                ))}
              </nav>

              <div className="relative hidden md:block" ref={productRef}>
                <button
                  onClick={() => {
                    setProductOpen((v) => !v);
                    setResourcesOpen(false);
                  }}
                  aria-expanded={productOpen}
                  aria-haspopup="true"
                  className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer overflow-hidden ${
                    productOpen
                      ? "text-white/85 bg-white/[0.06] ring-1 ring-inset ring-indigo-500/30 shadow-[0_0_18px_-6px_rgba(99,102,241,0.5)]"
                      : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                  }`}
                >
                  {productOpen && (
                    <span
                      className="absolute inset-0 opacity-50 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.25), transparent 70%)",
                      }}
                    />
                  )}
                  Product
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      productOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {productOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2 w-[260px] rounded-xl bg-[#0a0a0d]/97 backdrop-blur-2xl border border-white/[0.07] overflow-hidden z-50 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_-8px_rgba(0,0,0,0.7),0_0_40px_-8px_rgba(99,102,241,0.18)]"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-12 opacity-40 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18), transparent 70%)",
                        }}
                      />
                      <div className="px-4 pt-4 pb-2.5 border-b border-white/[0.04] relative z-10">
                        <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-white/15">
                          Platform
                        </span>
                      </div>
                      <div className="p-2 relative z-10">
                        {productLinks.map((link, i) => (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.2 }}
                          >
                            <Link
                              href={link.href}
                              onClick={() => setProductOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                            >
                              <div className="relative w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.04] group-hover:border-indigo-500/25 bg-indigo-500/[0.04] group-hover:bg-indigo-500/[0.08] transition-all duration-200">
                                <span className="w-2 h-2 rounded-full bg-indigo-300/60 group-hover:bg-indigo-200 transition-colors shadow-[0_0_6px_rgba(165,180,252,0.6)]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-white/55 group-hover:text-white/95 transition-colors leading-tight flex items-center gap-1">
                                  {link.label}
                                  <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                                </p>
                                <p className="text-[11px] text-white/22 mt-0.5 leading-snug group-hover:text-white/40 transition-colors">
                                  {link.desc}
                                </p>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources dropdown */}
              <div className="relative hidden md:block" ref={resourcesRef}>
                <button
                  onClick={() => {
                    setResourcesOpen((v) => !v);
                    setProductOpen(false);
                  }}
                  aria-expanded={resourcesOpen}
                  aria-haspopup="true"
                  className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer overflow-hidden ${
                    resourcesOpen
                      ? "text-white/85 bg-white/[0.06] ring-1 ring-inset ring-indigo-500/30 shadow-[0_0_18px_-6px_rgba(99,102,241,0.5)]"
                      : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                  }`}
                >
                  {resourcesOpen && (
                    <span
                      className="absolute inset-0 opacity-50 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.25), transparent 70%)",
                      }}
                    />
                  )}
                  <Library className="w-3 h-3 relative z-10" />
                  <span className="relative z-10">Resources</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-10 ${
                      resourcesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {resourcesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2 w-[420px] rounded-xl bg-[#0a0a0d]/97 backdrop-blur-2xl border border-white/[0.07] overflow-hidden z-50 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_-8px_rgba(0,0,0,0.7),0_0_40px_-8px_rgba(99,102,241,0.18)]"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-16 opacity-50 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.22), transparent 70%)",
                        }}
                      />
                      <div className="grid grid-cols-2 relative z-10">
                        {resourcesLinks.map((link, i) => (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025, duration: 0.2 }}
                          >
                            <Link
                              href={link.href}
                              onClick={() => setResourcesOpen(false)}
                              className="group flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer border-b border-r border-white/[0.03] last:border-r-0 [&:nth-last-child(-n+2)]:border-b-0"
                            >
                              <div className="relative w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.04] group-hover:border-indigo-500/25 bg-indigo-500/[0.04] group-hover:bg-indigo-500/[0.08] transition-all duration-200 flex-shrink-0 mt-0.5">
                                <link.icon className="w-3.5 h-3.5 text-indigo-200/70 group-hover:text-indigo-200 transition-colors" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12.5px] font-medium text-white/55 group-hover:text-white/95 transition-colors leading-tight flex items-center gap-1">
                                  {link.label}
                                  <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                                </p>
                                <p className="text-[10.5px] text-white/25 mt-0.5 leading-snug group-hover:text-white/40 transition-colors">
                                  {link.desc}
                                </p>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-mono text-white/25 uppercase tracking-[0.15em]">
                          {resourcesLinks.length} pages
                        </span>
                        <a
                          href="https://github.com/shinmentakezo07/owsiwa"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-white/30 hover:text-indigo-200 flex items-center gap-1 transition-colors"
                        >
                          <GithubIcon className="w-3 h-3" />
                          Star on GitHub
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search trigger — command-palette style */}
              <button
                onClick={onSearchOpen}
                aria-label="Search documentation (Ctrl+K)"
                className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-white/[0.025] via-white/[0.02] to-white/[0.025] border border-white/[0.07] text-white/40 hover:text-white/80 hover:border-indigo-500/30 hover:from-indigo-500/[0.06] hover:to-indigo-500/[0.02] transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.18), transparent 60%)",
                  }}
                />
                <Search className="w-3.5 h-3.5 group-hover:text-indigo-200 transition-colors relative z-10" />
                <span className="hidden sm:inline text-[12px] font-medium relative z-10">
                  Search
                </span>
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-[2px] rounded-[4px] bg-white/[0.05] border border-white/[0.07] text-[9px] font-mono text-white/20 group-hover:text-indigo-200/80 group-hover:border-indigo-500/20 leading-none relative z-10 transition-colors duration-300">
                  <Command className="w-[10px] h-[10px]" />K
                </kbd>
              </button>

              {/* GitHub icon */}
              <a
                href="https://github.com/shinmentakezo07/owsiwa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
                className="relative p-2 rounded-lg text-white/20 hover:text-white/65 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer ml-0.5 group/gh overflow-hidden"
              >
                <span className="absolute inset-0 rounded-lg bg-white/[0.02] opacity-0 group-hover/gh:opacity-100 transition-opacity" />
                <GithubIcon className="w-4 h-4 relative z-10 transition-colors" />
              </a>
            </div>
          </header>
        </div>
      </motion.div>
    </div>
  );
}
