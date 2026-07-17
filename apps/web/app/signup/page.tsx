"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { signup, authenticateSocial, type State } from "@/app/lib/actions";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Infinity,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   SIGNUP — parity with /login
   Void black · h-dvh · glass card · nervous-cat logo · simple white CTA
   Auth: signup / authenticateSocial (unchanged).
   ──────────────────────────────────────────────────────────────────────── */

const ease = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    icon: KeyRound,
    title: "One API key",
    body: "Route to 100+ models without provider sprawl.",
    accent: "text-blue-400",
    ring: "ring-blue-400/20 bg-blue-500/10",
  },
  {
    icon: Sparkles,
    title: "$5 free credits",
    body: "Start building today. No credit card required.",
    accent: "text-violet-400",
    ring: "ring-violet-400/20 bg-violet-500/10",
  },
  {
    icon: Infinity,
    title: "Pay-as-you-go",
    body: "Transparent pricing. Credits never expire.",
    accent: "text-fuchsia-400",
    ring: "ring-fuchsia-400/20 bg-fuchsia-500/10",
  },
] as const;

function HUDOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute left-10 top-10 hidden h-16 w-16 rounded-tl-2xl border-l-2 border-t-2 border-white/10 lg:block" />
      <div className="absolute right-10 top-10 hidden h-16 w-16 rounded-tr-2xl border-r-2 border-t-2 border-white/10 lg:block" />
      <div className="absolute bottom-10 left-10 hidden h-16 w-16 rounded-bl-2xl border-l-2 border-b-2 border-white/10 lg:block" />
      <div className="absolute bottom-10 right-10 hidden h-16 w-16 rounded-br-2xl border-r-2 border-b-2 border-white/10 lg:block" />
      <div className="absolute left-8 top-1/3 hidden h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />
      <div className="absolute bottom-1/3 right-8 hidden h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />
      <div className="absolute right-28 top-12 hidden text-[10px] font-mono tracking-widest text-white/20 lg:block">
        REG.V.3.0 // SECURE
      </div>
      <div className="absolute bottom-12 left-28 hidden text-[10px] font-mono tracking-widest text-white/20 lg:block">
        SESSION: INIT
      </div>
    </div>
  );
}

function Atmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-black"
      aria-hidden="true"
    />
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 text-white transition-opacity hover:opacity-90"
    >
      <span
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-xl border border-[#3b82f6]/30 bg-black shadow-[0_0_24px_-8px_rgba(59,130,246,0.55)]",
          compact ? "h-9 w-9" : "h-11 w-11",
        )}
      >
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4px_4px]"
        />
        <Image
          src="/nervous-cat.jpg"
          alt="Yapapa"
          width={compact ? 32 : 40}
          height={compact ? 32 : 40}
          className={cn(
            "relative z-10 object-cover",
            compact ? "h-7 w-7 rounded-md" : "h-9 w-9 rounded-lg",
          )}
          priority
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 shadow-[inset_0_0_18px_rgba(59,130,246,0.35)]"
        />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "font-black uppercase italic tracking-tighter text-white",
            compact ? "text-base" : "text-lg",
          )}
          style={{ textShadow: "2px 2px 0px rgba(59,130,246,0.25)" }}
        >
          Yapapa
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-sm bg-[#3b82f6]" />
          <span className="h-px w-10 bg-gradient-to-r from-[#3b82f6] via-[#7c3aed] to-transparent" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c3aed]">
            Gateway
          </span>
        </span>
      </span>
    </Link>
  );
}

function Field({
  id,
  name,
  type = "text",
  label,
  placeholder,
  autoComplete,
  required,
  value,
  onChange,
  error,
  inputRef,
  icon: Icon,
  minLength,
  trailing,
}: {
  id: string;
  name: string;
  type?: string;
  label: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string[];
  inputRef?: React.Ref<HTMLInputElement>;
  icon: React.ComponentType<{ className?: string }>;
  minLength?: number;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error?.length);

  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={id}
          className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40"
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-all duration-300",
          hasError
            ? "border-red-500/40 bg-red-500/[0.04]"
            : focused
              ? "border-blue-500/40 bg-white/[0.04] shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]",
        )}
      >
        <Icon
          className={cn(
            "pointer-events-none absolute left-3 h-4 w-4 transition-colors",
            hasError
              ? "text-red-300/80"
              : focused
                ? "text-blue-400"
                : "text-white/30",
          )}
        />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          minLength={minLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={hasError || undefined}
          className={cn(
            "w-full bg-transparent py-2.5 pl-10 text-[14px] text-white placeholder:text-white/25 focus:outline-none",
            trailing ? "pr-10" : "pr-3",
          )}
        />
        {trailing}
      </div>
      <AnimatePresence>
        {hasError ? (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pl-0.5 text-[11px] font-mono text-red-400"
          >
            {error![0]}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const reqs = [
    { label: "6+ chars", met: password.length >= 6 },
    { label: "number", met: /\d/.test(password) },
    { label: "uppercase", met: /[A-Z]/.test(password) },
  ];
  const met = reqs.filter((r) => r.met).length;
  if (!password) return null;

  const strengthLabels = ["TOO WEAK", "FAIR", "STRONG"] as const;
  const labelColor = [
    "text-red-400",
    "text-amber-400",
    "text-emerald-400",
  ] as const;
  const barFill = ["bg-red-500", "bg-amber-400", "bg-emerald-500"] as const;
  const idx = Math.max(0, met - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1 pt-0.5"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors duration-300",
              i < met ? barFill[Math.min(met - 1, 2)] : "bg-white/[0.06]",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[9px] font-mono font-bold tracking-widest",
            labelColor[idx],
          )}
        >
          {strengthLabels[idx]}
        </span>
        <div className="flex items-center gap-2">
          {reqs.map((r) => (
            <span
              key={r.label}
              className={cn(
                "flex items-center gap-1 text-[9px] font-mono",
                r.met ? "text-emerald-400" : "text-gray-600",
              )}
            >
              {r.met ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/10" />
              )}
              {r.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SubmitButton({ reduce }: { reduce: boolean | null }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
      className={cn(
        "group relative mt-1 h-11 w-full overflow-hidden rounded-xl",
        "border border-white/[0.1] bg-white text-[14px] font-semibold tracking-tight text-black",
        "transition-colors duration-200",
        "hover:bg-white/90",
        "focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {!reduce && !pending && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Creating account…</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </span>
    </Button>
  );
}

function SocialButton({
  provider,
  label,
}: {
  provider: "github" | "google";
  label: string;
}) {
  return (
    <form
      action={async () => {
        await authenticateSocial(provider);
      }}
      className="flex-1"
    >
      <Button
        type="submit"
        variant="outline"
        aria-label={`Sign up with ${label}`}
        className={cn(
          "group/social relative h-10 w-full overflow-hidden rounded-xl border-white/[0.08] bg-white/[0.03]",
          "text-sm font-medium text-gray-300",
          "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
          "transition-all duration-300",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/social:opacity-100 bg-gradient-to-r from-blue-500/[0.06] via-transparent to-violet-500/[0.06]"
        />
        <span className="relative z-10 inline-flex items-center gap-2">
          <ProviderIcon provider={provider} />
          {label}
        </span>
      </Button>
    </form>
  );
}

function ProviderIcon({ provider }: { provider: "github" | "google" }) {
  if (provider === "github") {
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const initialState: State = { message: null, errors: {} };
  const [state, dispatch] = useActionState(signup, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const errorId = useId();

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <div className="relative h-dvh max-h-dvh overflow-hidden bg-black text-white selection:bg-primary/30 selection:text-white">
      <Atmosphere />
      <HUDOverlay />

      <div className="relative z-10 flex h-full min-h-0 flex-col lg:flex-row">
        {/* ── Left: brand editorial ── */}
        <section className="relative hidden min-h-0 flex-col justify-between border-r border-white/[0.06] px-8 py-6 lg:flex lg:w-[46%] xl:px-10 xl:py-7">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <BrandMark />
          </motion.div>

          <div className="max-w-md py-4">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.1, duration: 0.45, ease }}
              className="group/badge relative mb-4 inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-white/[0.08] bg-black/40 p-[3px] pr-3.5 shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_8px_32px_-12px_rgba(59,130,246,0.35)] backdrop-blur-xl transition-all duration-500 hover:border-blue-400/25 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_12px_40px_-10px_rgba(124,58,237,0.4)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/[0.12] via-violet-500/[0.08] to-transparent opacity-80 transition-opacity duration-500 group-hover/badge:opacity-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -left-6 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-blue-500/30 blur-xl transition-all duration-500 group-hover/badge:bg-violet-500/35"
              />

              <span className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500/25 to-emerald-400/10 px-2.5 py-1 ring-1 ring-inset ring-emerald-400/35">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70",
                      !reduce && "animate-ping",
                    )}
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Free
                </span>
              </span>

              <span
                aria-hidden
                className="relative h-3.5 w-px shrink-0 bg-gradient-to-b from-transparent via-white/25 to-transparent"
              />

              <span className="relative flex min-w-0 items-center gap-2">
                <Zap className="hidden h-3 w-3 shrink-0 text-blue-400 sm:block" />
                <span className="truncate text-[11px] font-mono uppercase tracking-[0.16em] text-white/65 transition-colors duration-300 group-hover/badge:text-white/85">
                  $5 credits on signup
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.15, duration: 0.65, ease }}
              className="text-4xl font-bold tracking-tighter text-white xl:text-5xl xl:leading-[0.95]"
            >
              Start free.
              <br />
              <span className="font-display italic font-normal bg-gradient-to-br from-indigo-100 via-violet-200 to-blue-300 bg-clip-text text-transparent">
                Ship faster.
              </span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.3, duration: 0.5 }}
              className="mt-3 max-w-sm text-sm leading-relaxed text-gray-400"
            >
              One API. 100+ models. Pay per token — no subscriptions, no
              lock-in.
            </motion.p>

            {/* Quiet 3-step path */}
            <motion.ol
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.35, duration: 0.45 }}
              className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/30"
            >
              {["Register", "Get key", "Ship"].map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="h-px w-4 bg-gradient-to-r from-white/20 to-transparent"
                    />
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-white/45">0{i + 1}</span>
                    <span className="text-white/55">{step}</span>
                  </span>
                </li>
              ))}
            </motion.ol>

            <ul className="mt-5 space-y-2">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.li
                    key={f.title}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: reduce ? 0 : 0.4 + i * 0.07,
                      duration: 0.45,
                      ease,
                    }}
                    className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:scale-105",
                        f.ring,
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", f.accent)} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-white/90">
                        {f.title}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-gray-500">
                        {f.body}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.65, duration: 0.45 }}
              className="mt-5 grid grid-cols-3 gap-2"
            >
              {[
                ["100+", "Models"],
                ["SSE", "Streaming"],
                ["$5", "Free start"],
              ].map(([k, v]) => (
                <div
                  key={v}
                  className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent px-2.5 py-2"
                >
                  <p className="font-mono text-base font-bold tracking-tight text-white">
                    {k}
                  </p>
                  <p className="mt-0.5 text-[9px] font-mono uppercase tracking-widest text-gray-500">
                    {v}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.65, duration: 0.4 }}
            className="flex items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30"
          >
            <span>v3.0 · gateway</span>
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Ready to build
            </span>
          </motion.div>
        </section>

        {/* ── Right: glass form ── */}
        <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="absolute left-4 top-4 z-10 lg:hidden">
            <BrandMark compact />
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.2, duration: 0.65, ease }}
            className="relative w-full max-w-[400px] py-14 lg:py-0"
          >
            <div className="glass-card relative overflow-hidden rounded-[24px] p-1 shadow-2xl shadow-black/60 ring-1 ring-white/5">
              <div className="relative rounded-[20px] border border-white/[0.07] bg-[#0A0A0A] p-5 sm:p-6">
                {/* Top glass specular */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-16 bg-gradient-to-b from-white/[0.04] to-transparent"
                />
                <div
                  className="pointer-events-none absolute bottom-0 right-0 h-12 w-px bg-gradient-to-t from-violet-500/40 to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute bottom-0 right-0 h-px w-12 bg-gradient-to-l from-violet-500/40 to-transparent"
                  aria-hidden
                />

                <div className="relative mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="relative mb-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#3b82f6]/30 bg-black shadow-[0_0_28px_-8px_rgba(59,130,246,0.55)] ring-1 ring-white/10">
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4px_4px]"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-br from-violet-600/25 to-blue-600/20"
                      />
                      <Image
                        src="/nervous-cat.jpg"
                        alt="Yapapa"
                        width={36}
                        height={36}
                        className="relative z-10 h-8 w-8 rounded-md object-cover"
                        priority
                      />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      Create account
                    </h2>
                    <p className="mt-1 text-[13px] text-gray-400">
                      Get your API key in under a minute.
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Free
                  </span>
                </div>

                <div className="relative mb-4 flex gap-2.5">
                  <SocialButton provider="github" label="GitHub" />
                  <SocialButton provider="google" label="Google" />
                </div>

                <div className="relative mb-4">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A0A0A] px-3 text-[10px] font-mono uppercase tracking-[0.22em] text-gray-500">
                    or email
                  </span>
                </div>

                <form
                  action={dispatch}
                  className="space-y-3"
                  aria-label="Sign up form"
                >
                  <Field
                    id="name"
                    name="name"
                    label="Name"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    required
                    inputRef={nameRef}
                    error={state.errors?.name}
                    icon={User}
                  />

                  <Field
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="jane@company.com"
                    autoComplete="email"
                    required
                    error={state.errors?.email}
                    icon={Mail}
                  />

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40"
                    >
                      Password
                    </label>
                    <div
                      className={cn(
                        "relative flex items-center rounded-xl border transition-all duration-300",
                        state.errors?.password
                          ? "border-red-500/40 bg-red-500/[0.04]"
                          : "border-white/[0.08] bg-white/[0.02] focus-within:border-blue-500/40 focus-within:bg-white/[0.04] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] hover:border-white/[0.14]",
                      )}
                    >
                      <Lock
                        className={cn(
                          "pointer-events-none absolute left-3 h-4 w-4",
                          state.errors?.password
                            ? "text-red-300/80"
                            : "text-white/30",
                        )}
                      />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        aria-invalid={
                          Boolean(state.errors?.password) || undefined
                        }
                        className="w-full bg-transparent py-2.5 pl-10 pr-10 text-[14px] text-white placeholder:text-white/25 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {state.errors?.password ? (
                      <p
                        role="alert"
                        className="pl-0.5 text-[11px] font-mono text-red-400"
                      >
                        {state.errors.password[0]}
                      </p>
                    ) : null}
                    <PasswordStrength password={password} />
                  </div>

                  <AnimatePresence>
                    {state.message ? (
                      <motion.div
                        id={errorId}
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px]",
                          state.message.includes("Success")
                            ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-200/95"
                            : "border-red-400/25 bg-red-500/[0.08] text-red-200/95",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            state.message.includes("Success")
                              ? "bg-emerald-400"
                              : "bg-red-400",
                          )}
                        />
                        <span>{state.message}</span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <SubmitButton reduce={reduce} />
                </form>

                <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                    <Sparkles className="h-3.5 w-3.5 text-white/50" />
                  </div>
                  <p className="min-w-0 text-[12px] leading-relaxed text-gray-400">
                    <span className="font-medium text-white/85">
                      $5 free credits
                    </span>
                    <span className="text-white/25"> · </span>
                    included on signup. No card required.
                  </p>
                </div>

                <p className="mt-3.5 text-[13px] text-gray-400">
                  Have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-white underline decoration-white/25 underline-offset-[6px] transition-colors hover:text-blue-200 hover:decoration-blue-300/50"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
