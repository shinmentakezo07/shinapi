"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Copy,
  Check,
  KeyRound,
  Terminal,
  ArrowRight,
} from "lucide-react";
import type { OpenRouterModelData } from "@/types/model";
import { getProviderTheme } from "@/lib/model-utils";

interface QuickStartCardProps {
  model: OpenRouterModelData;
}

const ease = [0.16, 1, 0.3, 1] as const;

type SnippetLang = "curl" | "typescript" | "python";

interface Snippet {
  lang: SnippetLang;
  label: string;
  file: string;
  code: string;
}



// Generate the snippets dynamically from the model
function buildSnippets(model: OpenRouterModelData): Record<SnippetLang, Snippet> {
  const id = model.id;
  return {
    curl: {
      lang: "curl",
      label: "cURL",
      file: "request.sh",
      code: `curl https://yapa.up.railway.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YOUR_API_KEY" \\
  -d '{
    "model": "${id}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    },
    typescript: {
      lang: "typescript",
      label: "TypeScript",
      file: "chat.ts",
      code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.YAPAPA_API_KEY,
  baseURL: "https://yapa.up.railway.app/v1",
});

const completion = await client.chat.completions.create({
  model: "${id}",
  messages: [
    { role: "user", content: "Hello!" },
  ],
});

console.log(completion.choices[0].message.content);`,
    },
    python: {
      lang: "python",
      label: "Python",
      file: "chat.py",
      code: `from openai import OpenAI

client = OpenAI(
    api_key=os.environ["YAPAPA_API_KEY"],
    base_url="https://yapa.up.railway.app/v1",
)

completion = client.chat.completions.create(
    model="${id}",
    messages=[
        {"role": "user", "content": "Hello!"},
    ],
)

print(completion.choices[0].message.content)`,
    },
  };
}

// Lightweight keyword tint — instead of full tokenize, color just the few
// language keywords that matter, keep the rest as plain monospace.
// Avoids a hand-rolled broken parser while still feeling highlighted.
const KEY_TINT: Record<SnippetLang, Record<string, string>> = {
  curl: {
    curl: "text-fuchsia-300",
  },
  typescript: {
    import: "text-fuchsia-300",
    from: "text-fuchsia-300",
    const: "text-fuchsia-300",
    let: "text-fuchsia-300",
    var: "text-fuchsia-300",
    await: "text-fuchsia-300",
    new: "text-fuchsia-300",
    console: "text-sky-300",
    process: "text-orange-300",
  },
  python: {
    from: "text-fuchsia-300",
    import: "text-fuchsia-300",
    def: "text-fuchsia-300",
    class: "text-fuchsia-300",
    print: "text-sky-300",
    return: "text-fuchsia-300",
  },
};

function tintSnippet(
  code: string,
  lang: SnippetLang,
): { text: string; cls?: string }[] {
  const keywords = KEY_TINT[lang];
  // Strategy: split the code by lines, then for each line, walk word-by-word
  // and split on whitespace boundaries. Match whole words against keywords.
  // This is intentionally simple — the snippet is a single illustrative block,
  // not a full code editor.
  const tokens: { text: string; cls?: string }[] = [];
  const lines = code.split("\n");
  lines.forEach((line, li) => {
    // String-aware line split: pull out quoted strings first as one token,
    // then split the rest on word boundaries.
    const lineTokens: { text: string; cls?: string }[] = [];
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        const q = ch;
        let j = i + 1;
        while (j < line.length && line[j] !== q) j++;
        const end = j < line.length ? j + 1 : j;
        lineTokens.push({ text: line.slice(i, end), cls: "text-emerald-300/85" });
        i = end;
        continue;
      }
      // Identifier-ish run
      if (/[A-Za-z0-9_$]/.test(ch)) {
        let j = i + 1;
        while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (keywords[word]) {
          lineTokens.push({ text: word, cls: keywords[word] });
        } else {
          lineTokens.push({ text: word });
        }
        i = j;
        continue;
      }
      // Numbers
      if (/[0-9]/.test(ch)) {
        let j = i + 1;
        while (j < line.length && /[0-9.]/.test(line[j])) j++;
        lineTokens.push({ text: line.slice(i, j), cls: "text-amber-300" });
        i = j;
        continue;
      }
      // Misc (spaces, punctuation)
      lineTokens.push({ text: ch });
      i++;
    }
    tokens.push(...lineTokens);
    if (li < lines.length - 1) tokens.push({ text: "\n" });
  });
  return tokens;
}

export function QuickStartCard({ model }: QuickStartCardProps) {
  const [active, setActive] = useState<SnippetLang>("curl");
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();
  const theme = getProviderTheme(model.id);
  const accent = theme?.accent || "#6366f1";

  const snippets = useMemo(() => buildSnippets(model), [model]);
  const current = snippets[active];

  const copySnippet = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedTokens = useMemo(() => tintSnippet(current.code, active), [current.code, active]);

  return (
    <motion.section
      initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease }}
      aria-label="Quick start"
      id="quickstart"
      className="mt-2"
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className="text-[10px] font-mono font-bold tracking-wider"
          style={{ color: accent }}
        >
          06
        </span>
        <h2 className="text-[10px] font-mono tracking-[0.25em] uppercase text-gray-500">
          Quick Start
        </h2>
        <span
          className="flex-1 h-px"
          style={{ backgroundColor: `${accent}12` }}
        />
      </div>

      <div
        className="rounded-2xl border relative overflow-hidden"
        style={{ borderColor: `${accent}12`, backgroundColor: `${accent}04` }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, ${accent}30, transparent)`,
          }}
        />

        {/* Tab bar */}
        <div
          className="flex items-center justify-between gap-3 px-2 sm:px-4 pt-2.5"
          style={{ borderBottomColor: `${accent}0a`, borderBottomWidth: 1 }}
        >
          <div
            className="flex items-center gap-2 overflow-x-auto"
            role="tablist"
            aria-label="Code language"
          >
            <div className="hidden sm:flex gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-red-500/30" />
              <span className="w-2 h-2 rounded-full bg-yellow-500/30" />
              <span className="w-2 h-2 rounded-full bg-green-500/30" />
            </div>
            {(Object.values(snippets)).map((s) => {
              const isActive = active === s.lang;
              const Icon = s.lang === "curl" ? Terminal : LanguageIcon(s.lang);
              return (
                <button
                  key={s.lang}
                  id={`snippet-tab-${s.lang}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`snippet-panel-${s.lang}`}
                  onClick={() => setActive(s.lang)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-mono font-semibold tracking-wider transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{
                    backgroundColor: isActive ? `${accent}15` : "transparent",
                    // @ts-expect-error CSS custom
                    "--tw-ring-color": `${accent}40`,
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                  {isActive && (
                    <motion.div
                      layoutId="snippet-tab-marker"
                      className="absolute inset-x-2 bottom-0 h-px"
                      style={{ backgroundColor: accent }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={copySnippet}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: copied ? "#4ade80" : `${accent}aa`,
              backgroundColor: `${accent}0a`,
              // @ts-expect-error CSS custom
              "--tw-ring-color": `${accent}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${accent}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${accent}0a`;
            }}
            aria-label={`Copy ${current.label} snippet to clipboard`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Code panel */}
        <div
          id={`snippet-panel-${active}`}
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          className="relative"
        >
          <AnimatePresence mode="wait">
            <motion.pre
              key={active}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="px-4 sm:px-5 pt-2.5 pb-5 text-[11px] sm:text-[12px] font-mono leading-[1.7] overflow-x-auto whitespace-pre text-gray-300"
            >
              <code>
                {renderedTokens.map((t, i) => (
                  <span key={i} className={t.cls}>{t.text}</span>
                ))}
              </code>
            </motion.pre>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3.5 flex items-center justify-between gap-3"
          style={{
            backgroundColor: `${accent}06`,
            borderTopColor: `${accent}0a`,
            borderTopWidth: 1,
          }}
        >
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
            <KeyRound className="w-3 h-3" style={{ color: `${accent}50` }} />
            Need an API key?
          </div>
          <a
            href="/dashboard/keys"
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{
              backgroundColor: accent,
              color: "#000",
              // @ts-expect-error CSS custom
              "--tw-ring-color": `${accent}60`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            Get API Key <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.section>
  );
}

function LanguageIcon(lang: SnippetLang) {
  return lang === "python" ? PythonIcon : TypeScriptIcon;
}

function TypeScriptIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 3h18v18H3V3zm10.5 13.5c0 .6-.2 1.1-.5 1.4-.4.3-.9.5-1.7.5-.7 0-1.4-.2-1.9-.5l.3-1.2c.4.2.9.4 1.5.4.4 0 .7-.1.9-.3.2-.2.2-.4.2-.7 0-.3-.1-.5-.3-.7-.2-.2-.5-.3-.9-.4l-.5-.1c-.6-.2-1.1-.4-1.4-.8-.3-.4-.5-.8-.5-1.4 0-.6.2-1.1.6-1.4.4-.3.9-.5 1.6-.5.7 0 1.3.2 1.7.4l-.3 1.2c-.3-.2-.7-.3-1.2-.3-.4 0-.6.1-.8.3-.2.2-.3.4-.3.6 0 .3.1.5.3.6.2.1.5.3.9.4l.5.1c.7.2 1.2.5 1.6.9.4.4.6.9.6 1.5z" />
    </svg>
  );
}

function PythonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.5 2c-2.5 0-4.5 1.5-4.5 4v2h4v.5H5.5C3.5 8.5 2 10.5 2 12.5s1.5 4 3.5 4H7v-2c0-2 1.5-4 4-4h5c2 0 3.5-1.5 3.5-3.5V4c0-1.5-2-2-4-2h-4zm-2 2.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zM12.5 22c2.5 0 4.5-1.5 4.5-4v-2h-4v-.5h5.5c2 0 3.5-2 3.5-4s-1.5-4-3.5-4H17v2c0 2-1.5 4-4 4H8c-2 0-3.5 1.5-3.5 3.5V20c0 1.5 2 2 4 2h4zM14.5 21c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
    </svg>
  );
}

