"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Play,
  CheckCircle,
  Activity,
  Sparkles,
  Cpu,
  Globe,
  Zap,
  Layers,
  X,
  Terminal as TerminalIcon,
  Command,
  Hash,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import type { ReactNode, SVGProps, CSSProperties } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Icons ---
const ReactIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="-10.5 -9.45 21 18.9" fill="currentColor" {...props}>
    <circle cx="0" cy="0" r="2" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="10" ry="4.5" />
      <ellipse rx="10" ry="4.5" transform="rotate(60)" />
      <ellipse rx="10" ry="4.5" transform="rotate(120)" />
    </g>
  </svg>
);

const JavaScriptIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
    <path d="M0 0h48v48H0z" fill="transparent" />
    <path d="M6 6h36v36H6z" fill="currentColor" fillOpacity="0.1" />
    <text
      x="24"
      y="34"
      fontFamily="monospace"
      fontSize="24"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      JS
    </text>
  </svg>
);

const TypeScriptIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
    <path d="M0 0h48v48H0z" fill="transparent" />
    <path d="M6 6h36v36H6z" fill="currentColor" fillOpacity="0.1" />
    <text
      x="24"
      y="34"
      fontFamily="monospace"
      fontSize="24"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      TS
    </text>
  </svg>
);

const PythonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
    <path
      d="M24 2C14 2 14 10 14 10h10v4h-14c-6 0-6 10-6 10s0 10 6 10h4v-4h-4v-6h12v6h-4v4h10c6 0 6-10 6-10s0-10-6-10h-4v4h4v6h-12v-6h4v-4h-10c-6 0-6-10-6-10z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <text
      x="24"
      y="34"
      fontFamily="monospace"
      fontSize="24"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      PY
    </text>
  </svg>
);

const HtmlIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
    <path d="M8 4h32l-4 36-12 4-12-4z" fill="currentColor" fillOpacity="0.1" />
    <text
      x="24"
      y="34"
      fontFamily="monospace"
      fontSize="18"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      HTML
    </text>
  </svg>
);

const CssIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
    <path d="M8 4h32l-4 36-12 4-12-4z" fill="currentColor" fillOpacity="0.1" />
    <text
      x="24"
      y="34"
      fontFamily="monospace"
      fontSize="18"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      CSS
    </text>
  </svg>
);

const JavaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      d="M4.5 18.5C4.5 18.5 7.5 21 12 21C16.5 21 19.5 18.5 19.5 18.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M6.5 15.5C6.5 15.5 8.5 17 12 17C15.5 17 17.5 15.5 17.5 15.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 3V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CppIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      d="M6 8L2 12L6 16M18 8L22 12L18 16M14.5 4L9.5 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text x="18" y="22" fontSize="10" fontWeight="bold" fill="currentColor">
      ++
    </text>
  </svg>
);

const RustIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const GoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <text
      x="12"
      y="16"
      fontSize="14"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      GO
    </text>
  </svg>
);

const RubyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      d="M6 3L2 9L12 21L22 9L18 3H6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

const SwiftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      d="M4 4C8 4 8 10 14 10C20 10 21 5 21 5C21 5 20 14 15 17C10 20 4 18 4 18"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

const PhpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
    <text
      x="24"
      y="30"
      fontFamily="monospace"
      fontSize="16"
      fontWeight="bold"
      fill="currentColor"
      textAnchor="middle"
    >
      PHP
    </text>
  </svg>
);

const DockerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      d="M2 14H5V11H2V14ZM6 14H9V11H6V14ZM10 14H13V11H10V14ZM14 14H17V11H14V14ZM6 10H9V7H6V10ZM10 10H13V7H10V10ZM14 10H17V7H14V10ZM10 6H13V3H10V6Z"
      fill="currentColor"
    />
    <path
      d="M2 16H22C22 16 21 21 12 21C3 21 2 16 2 16Z"
      fill="currentColor"
      fillOpacity="0.3"
    />
  </svg>
);

const GitIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 8V16M6 12H10L18 12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const HERO_STATS: ReadonlyArray<{
  label: string;
  value: string;
  icon: typeof Layers;
}> = [
  { label: "Models", value: "100+", icon: Layers },
  { label: "Uptime", value: "99.99%", icon: Activity },
  { label: "p95 latency", value: "<50ms", icon: Zap },
];

// Glitch Text Component
const GlitchText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <div className={cn("glitch-wrapper inline-block", className)}>
      <span
        className="glitch relative inline-block text-white"
        data-text={text}
      >
        {text}
      </span>
    </div>
  );
};

// HUD Overlay Component
const HUDOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Corner Brackets */}
      <div className="absolute top-10 left-10 w-16 h-16 border-l-2 border-t-2 border-white/10 rounded-tl-2xl" />
      <div className="absolute top-10 right-10 w-16 h-16 border-r-2 border-t-2 border-white/10 rounded-tr-2xl" />
      <div className="absolute bottom-10 left-10 w-16 h-16 border-l-2 border-b-2 border-white/10 rounded-bl-2xl" />
      <div className="absolute bottom-10 right-10 w-16 h-16 border-r-2 border-b-2 border-white/10 rounded-br-2xl" />

      {/* Random Data Lines */}
      <div className="absolute top-1/3 left-8 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block" />
      <div className="absolute bottom-1/3 right-8 w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block" />

      {/* Decorative Text */}
      <div className="absolute top-12 right-28 text-[10px] font-mono text-white/20 hidden lg:block tracking-widest">
        SYS.V.2.04 // CONNECTED
      </div>
      <div className="absolute bottom-12 left-28 text-[10px] font-mono text-white/20 hidden lg:block tracking-widest">
        COORDS: 45.124 / 99.002
      </div>
    </div>
  );
};

// Cyber Button
const CyberButton = ({
  children,
  className,
  onClick,
  primary = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  primary?: boolean;
}) => {
  const [ripples, setRipples] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 500);
    }
    onClick?.();
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={cn(
        "relative group px-8 py-4 rounded-2xl font-mono text-sm font-bold tracking-wider overflow-hidden",
        "transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        primary
          ? "bg-white text-black hover:bg-white/90"
          : "border border-white/[0.10] bg-white/[0.045] text-white hover:border-white/30 hover:bg-white/[0.08]",
        className,
      )}
    >
      {/* Animated conic border (hover) — removed */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          primary
            ? "bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.35)_45%,transparent_70%)]"
            : "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_55%)]",
        )}
      />
      <div className="absolute inset-y-0 left-0 w-1/2 -translate-x-full bg-white/20 transition-transform duration-700 ease-out group-hover:translate-x-[220%]" />

      {/* Click ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            background: primary
              ? "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(167,139,250,0.55) 0%, transparent 70%)",
            animation: "ripple-expand 450ms ease-out forwards",
          }}
        />
      ))}

      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
};

// --- Typewriter ---
function TypewriterText({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.022, delayChildren: delay },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, damping: 18, stiffness: 240 },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: { type: "spring" as const, damping: 18, stiffness: 240 },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={`inline-block ${className}`}
    >
      {letters.map((letter, index) => (
        <motion.span
          variants={child}
          key={index}
          className="inline-block whitespace-pre"
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

// --- Interactive Terminal ---
const codeSnippets = [
  {
    id: "curl",
    name: "curl-request.sh",
    language: "bash",
    icon: TerminalIcon,
    color: "text-green-400",
    code: `curl https://api.shinmen-takzo.ai/v1/chat/completions \\\n  -H "Authorization: Bearer sk-stz-..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "gpt-4",\n    "messages": [\n      {"role": "user", "content": "Hello!"}\n    ]\n  }'\n\n# Response: 200 OK\n# Routed to: openai/gpt-4\n# Latency: 847ms`,
  },
  {
    id: "py",
    name: "openai-client.py",
    language: "python",
    icon: PythonIcon,
    color: "text-yellow-400",
    code: `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="https://api.shinmen-takzo.ai/v1",\n    api_key="sk-stz-..."\n)\n\nresponse = client.chat.completions.create(\n    model="claude-opus-4",\n    messages=[{"role": "user", "content": "Hi"}]\n)\n\nprint(response.choices[0].message.content)`,
  },
  {
    id: "ts",
    name: "streaming.ts",
    language: "typescript",
    icon: TypeScriptIcon,
    color: "text-blue-400",
    code: `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: 'https://api.shinmen-takzo.ai/v1',\n  apiKey: process.env.STZ_API_KEY\n});\n\nconst stream = await client.chat.completions.create({\n  model: 'gemini-2.0-flash',\n  messages: [{ role: 'user', content: 'Hello' }],\n  stream: true\n});\n\nfor await (const chunk of stream) {\n  process.stdout.write(chunk.choices[0]?.delta?.content || '');\n}`,
  },
];

function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedCode, setDisplayedCode] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  useEffect(() => {
    setIsTyping(true);
    setDisplayedCode("");
    setShowSuccess(false);
    let i = 0;
    const code = codeSnippets[activeTab].code;

    const interval = setInterval(() => {
      setDisplayedCode(code.substring(0, i));
      i++;
      if (i > code.length) {
        clearInterval(interval);
        setIsTyping(false);
        setTimeout(() => setShowSuccess(true), 500);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [activeTab]);

  const ActiveIcon = codeSnippets[activeTab].icon;

  return (
    <div className="relative group perspective-1000 w-full max-w-lg mx-auto lg:mr-0 lg:ml-auto z-20">
      {/* Glass shine sweep (hover only) */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

      <motion.div
        initial={{ rotateY: 15, rotateX: 5 }}
        whileHover={{ rotateY: 0, rotateX: 0 }}
        transition={{ type: "spring" as const, stiffness: 50 }}
        className="relative h-[420px] flex flex-col bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
            <TerminalIcon className="w-3 h-3" />
            <span>bash — 80x24</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="relative flex items-center px-2 bg-black/20 overflow-x-auto scrollbar-hide">
          {codeSnippets.map((snippet, index) => {
            const isActive = activeTab === index;
            return (
              <button
                key={snippet.id}
                onClick={() => setActiveTab(index)}
                onMouseEnter={() => setHoveredTab(index)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`relative flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all duration-200 ${
                  isActive
                    ? "text-white bg-white/5"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <snippet.icon className="w-3 h-3" />
                {snippet.name}
                {isActive && (
                  <motion.span
                    layoutId="terminal-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                    transition={{ type: "spring" as const, stiffness: 350, damping: 30 }}
                  />
                )}
                {!isActive && hoveredTab === index && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-0 left-2 right-2 h-[1px] bg-white/20"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Code Area */}
        <div className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-hidden relative bg-[#050505]">
          {/* Scanline overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-[0.18] group-hover:opacity-[0.28] transition-opacity duration-300"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)",
              mixBlendMode: "screen",
            }}
          />

          {/* Line Numbers */}
          <div className="absolute left-0 top-6 bottom-0 w-12 flex flex-col items-end pr-4 text-white/10 select-none text-xs leading-relaxed border-r border-white/5 bg-white/[0.01]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <div className="pl-10 relative z-10">
            <pre
              className={`language-${codeSnippets[activeTab].language} ${codeSnippets[activeTab].color}`}
            >
              <code>{displayedCode}</code>
              {isTyping && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-2 h-4 bg-white align-middle ml-1"
                />
              )}
            </pre>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-1.5 border-t border-white/5 bg-black/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <GitIcon className="w-3 h-3" />
              <span>main*</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ActiveIcon className="w-3 h-3" />
              {codeSnippets[activeTab].language}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isTyping ? "bg-yellow-500" : "bg-green-500"}`}
            />
            {isTyping ? "BUILDING..." : "READY"}
          </div>
        </div>

        {/* Floating Success Badge */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ scale: 0, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute bottom-12 right-6 px-4 py-2 bg-green-950 border border-green-700 rounded flex items-center gap-3 text-green-200 text-xs font-mono"
            >
              <div className="relative">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">BUILD SUCCESSFUL</span>
                <span className="text-[9px] opacity-70">Time: 1.42s</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Decorative Floating Elements */}
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-6 -right-6 z-30 hidden md:block"
      >
        <div className="bg-black/80 p-3 rounded border border-white/10">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-10 -left-6 z-30 hidden md:block"
      >
        <div className="bg-black/80 p-3 rounded border border-white/10">
          <Command className="w-5 h-5 text-pink-400" />
        </div>
      </motion.div>
    </div>
  );
}

// --- Floating Logos Background ---
function FloatingLogos() {
  const icons = [
    {
      Icon: ReactIcon,
      color: "text-blue-400",
      size: 50,
      top: "10%",
      left: "5%",
      delay: 0,
    },
    {
      Icon: TypeScriptIcon,
      color: "text-blue-600",
      size: 45,
      top: "20%",
      right: "8%",
      delay: 1.5,
    },
    {
      Icon: JavaScriptIcon,
      color: "text-yellow-400",
      size: 50,
      top: "60%",
      left: "8%",
      delay: 3,
    },
    {
      Icon: PythonIcon,
      color: "text-green-500",
      size: 60,
      bottom: "15%",
      right: "12%",
      delay: 2,
    },
    {
      Icon: HtmlIcon,
      color: "text-orange-500",
      size: 40,
      top: "12%",
      right: "35%",
      delay: 4,
    },
    {
      Icon: CssIcon,
      color: "text-blue-300",
      size: 45,
      bottom: "25%",
      left: "15%",
      delay: 2.5,
    },
    {
      Icon: JavaIcon,
      color: "text-red-500",
      size: 50,
      top: "40%",
      left: "25%",
      delay: 1,
    },
    {
      Icon: CppIcon,
      color: "text-blue-500",
      size: 45,
      bottom: "40%",
      right: "25%",
      delay: 3.5,
    },
    {
      Icon: RustIcon,
      color: "text-orange-600",
      size: 40,
      top: "30%",
      left: "60%",
      delay: 0.5,
    },
    {
      Icon: GoIcon,
      color: "text-cyan-400",
      size: 55,
      bottom: "10%",
      left: "40%",
      delay: 2.2,
    },
    {
      Icon: RubyIcon,
      color: "text-red-600",
      size: 40,
      top: "80%",
      right: "5%",
      delay: 4.5,
    },
    {
      Icon: SwiftIcon,
      color: "text-orange-400",
      size: 45,
      top: "5%",
      left: "40%",
      delay: 1.8,
    },
    {
      Icon: PhpIcon,
      color: "text-indigo-400",
      size: 50,
      bottom: "50%",
      left: "5%",
      delay: 3.2,
    },
    {
      Icon: DockerIcon,
      color: "text-blue-500",
      size: 55,
      top: "50%",
      right: "45%",
      delay: 2.8,
    },
    {
      Icon: GitIcon,
      color: "text-red-500",
      size: 40,
      top: "15%",
      left: "80%",
      delay: 1.2,
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map((item, i) => (
        <div
          key={i}
          className={`absolute ${item.color} opacity-[0.07] blur-[0px] hover:opacity-30 hover:blur-0 transition-all duration-500 hero-float`}
          style={
            {
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              width: item.size,
              height: item.size,
              "--float-delay": `${item.delay}s`,
              "--float-dur": `${10 + (i % 4) * 2}s`,
            } as CSSProperties
          }
        >
          <item.Icon className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}

// --- New Background Effect ---
function HeroBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const orbARef = useRef<HTMLDivElement>(null);
  const orbBRef = useRef<HTMLDivElement>(null);
  const orbCRef = useRef<HTMLDivElement>(null);

  // Particle field — generated once, scroll-stable
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    opacity: 0.25 + Math.random() * 0.5,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
  }));

  useEffect(() => {
    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;
    function handleMouseMove({ clientX, clientY }: MouseEvent) {
      pendingX = clientX;
      pendingY = clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const el = spotlightRef.current;
        if (el)
          el.style.background = `radial-gradient(1100px circle at 320px ${pendingY}px rgba(167,139,250,0.10), ${pendingX}px ${pendingY}px rgba(99,102,241,0.18), transparent 78%)`;
      });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Mouse parallax — orbs drift slightly with the cursor for depth
  useEffect(() => {
    let rafId = 0;
    let tx = 0;
    let ty = 0;
    function handleParallax({ clientX, clientY }: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      tx = (clientX - cx) / cx;
      ty = (clientY - cy) / cy;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (orbARef.current)
          orbARef.current.style.translate = `${tx * 26}px ${ty * 22}px`;
        if (orbBRef.current)
          orbBRef.current.style.translate = `${tx * -20}px ${ty * -18}px`;
        if (orbCRef.current)
          orbCRef.current.style.translate = `${tx * 16}px ${ty * 14}px`;
      });
    }
    window.addEventListener("mousemove", handleParallax, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleParallax);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black" />
  );
}

// --- Video Modal ---
function VideoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-5xl aspect-video bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-white/20 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Placeholder Video Interface */}
            <div className="absolute inset-0 flex items-center justify-center bg-grid-pattern opacity-80">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto ring-1 ring-white/10 relative group cursor-pointer hover:bg-white/10 transition-all">
                  <Play className="w-10 h-10 text-white/50 ml-1 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20" />
                </div>
                <p className="text-muted-foreground font-mono text-sm tracking-widest">
                  PREVIEW_V2.0.mp4
                </p>
              </div>
            </div>

            {/* Mock Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 30, ease: "linear" }}
                className="h-full bg-primary"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Live Ticker ---
const updates = [
  "Claude Opus routed to us-east-1 in 14ms",
  "GPT-4o stream completed at 847 tokens/s",
  "New model: Gemini 2.5 Pro now available",
  "12.4k active developer workspaces online",
  "p95 latency: 47ms across all regions",
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % updates.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-24 right-4 lg:right-8 z-40 pointer-events-none hidden sm:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="px-3 py-1.5 rounded bg-[#0A0A0A] border border-white/10 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {updates[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Provider Marquee ---
const PROVIDER_NAMES = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Groq",
  "Mistral",
  "Meta",
  "NVIDIA NIM",
  "Cohere",
  "DeepSeek",
  "xAI",
];

function ProviderMarquee() {
  const row = [...PROVIDER_NAMES, ...PROVIDER_NAMES];
  return (
    <div className="relative w-full max-w-xl lg:max-w-none overflow-hidden hero-marquee-mask">
      <div className="flex w-max hero-marquee gap-3">
        {row.map((name, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-mono text-white/55 transition-colors hover:border-white/30 hover:text-white"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Floating Route Card ---
function FloatingRouteCard({
  label,
  model,
  region,
  ms,
  accent,
  className,
  delay,
}: {
  label: string;
  model: string;
  region: string;
  ms: string;
  accent: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay ?? 1.4, type: "spring", damping: 18, stiffness: 220 }}
      className={cn(
        "absolute z-30 hidden xl:block pointer-events-none",
        "px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0A0A0A]",
        "hero-card-bob",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40">
        <span className={cn("h-1.5 w-1.5 rounded-full", accent)} />
        {label}
      </div>
      <div className="mt-1 text-sm font-mono font-semibold text-white">
        {model}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-white/45">
        <span>{region}</span>
        <span className="text-emerald-400">{ms}</span>
      </div>
    </motion.div>
  );
}

// === MAIN HERO COMPONENT ===
export function Hero() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <>
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
      <LiveTicker />

      <section
        ref={targetRef}
        className="w-full min-h-screen flex items-center relative px-4 pt-20 overflow-hidden bg-black"
      >
        <HeroBackground />
        <HUDOverlay />

        {/* Mobile Terminal Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 lg:hidden pointer-events-none">
          <div className="w-full max-w-[90%] scale-75 sm:scale-90">
            <InteractiveTerminal />
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
          {/* Left Content */}
          <motion.div
            style={{ opacity, y }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="group inline-flex items-center gap-3 px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default hover:border-white/30"
            >
              <div className="flex items-center gap-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                <Sparkles className="w-3 h-3" />
                NEW
              </div>
              <span className="text-xs font-mono text-gray-400 tracking-wide group-hover:text-white transition-colors">
                Pay-per-use pricing now live
              </span>
            </motion.div>

            {/* Animated Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
                <TypewriterText text="Universal" delay={0.3} /> <br />
                <motion.span
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.85,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block text-white text-5xl font-black sm:text-6xl md:text-7xl lg:text-8xl"
                >
                  LLM GATEWAY
                </motion.span>
              </h1>
              <svg
                className="mx-auto h-3 w-56 text-white/60 lg:mx-0"
                viewBox="0 0 224 12"
                fill="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M2 10C38 2 74 2 111 7C151 12 184 9 222 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1.15, duration: 0.9, ease: "easeOut" }}
                />
                <motion.circle
                  cx="222"
                  cy="2"
                  r="2.5"
                  fill="currentColor"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.95, duration: 0.35, ease: "easeOut" }}
                />
              </svg>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl font-light leading-relaxed"
            >
              Access 100+ AI models through one unified API.
              <span className="text-white font-medium"> Pay per token</span>,
              <span className="text-white font-medium">
                {" "}
                transparent pricing
              </span>
              , and
              <span className="text-white font-medium">
                {" "}
                zero subscriptions
              </span>
              .
            </motion.p>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.32 }}
              className="flex w-full flex-wrap justify-center gap-3 lg:justify-start"
            >
              {HERO_STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.38 + index * 0.08 }}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 py-2 text-xs font-mono text-white/60 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
                  >
                    <span className="relative inline-flex">
                      <Icon className="relative h-3.5 w-3.5 text-white/80 transition-transform duration-300 group-hover:scale-110" />
                    </span>
                    <span className="font-semibold text-white/90">
                      {stat.value}
                    </span>
                    <span>{stat.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.58 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-4"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <CyberButton primary className="w-full sm:w-auto">
                  Get API Key{" "}
                  <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:animate-[hero-arrow-nudge_0.5s_ease-out]" />
                </CyberButton>
              </Link>

              <CyberButton
                onClick={() => setIsVideoOpen(true)}
                className="w-full sm:w-auto"
              >
                <Play className="w-4 h-4" /> View Demo
              </CyberButton>
            </motion.div>

            {/* Tech Stack / Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.75 }}
              className="pt-12 flex flex-col sm:flex-row items-center gap-6 text-muted-foreground text-sm border-t border-white/5 w-full"
            >
              <span className="uppercase tracking-widest text-[10px] font-mono opacity-50">
                POWERED BY
              </span>
              <div className="flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {[Cpu, Globe, Zap, Layers].map((Icon, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2, color: "#fff" }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Provider marquee — continuous logo strip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9 }}
              className="w-full pt-2"
            >
              <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
                Routing 100+ models from
              </div>
              <ProviderMarquee />
            </motion.div>
          </motion.div>

          {/* Right Content (3D Graphic) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" as const }}
            className="relative hidden lg:block"
          >
            <InteractiveTerminal />
            <FloatingRouteCard
              label="Routed"
              model="claude-opus-4"
              region="us-east-1"
              ms="14ms"
              accent="bg-indigo-400"
              className="-top-6 -left-10"
              delay={1.6}
            />
            <FloatingRouteCard
              label="Stream"
              model="gpt-4o"
              region="eu-west-3"
              ms="847 tok/s"
              accent="bg-cyan-400"
              className="bottom-16 -right-8"
              delay={2.0}
            />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/30"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">
            SCROLL_DOWN
          </span>
          <div className="relative h-10 w-[1px] overflow-hidden bg-white/20">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-6 w-[1px] bg-white"
            />
          </div>
        </motion.div>
      </section>
    </>
  );
}
