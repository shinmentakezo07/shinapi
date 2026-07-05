"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, authenticateSocial } from "@/app/lib/actions";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ────────────────────────────────────────────────────────────────────────
   LOGIN — "Avant-Garde Minimalism"
   One composition. One gesture. Motion only where it earns its place.
   ──────────────────────────────────────────────────────────────────────── */

/* ── Mesh gradient orbs — slow, atmospheric, never distracting ── */
function MeshOrbs({ reduce }: { reduce: boolean | null }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className={reduce ? "" : "animate-mesh-shift"}
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.6,
        }}
      />
      <div
        className={reduce ? "" : "animate-mesh-shift"}
        style={{
          position: "absolute",
          bottom: "-30%",
          right: "-20%",
          width: "90%",
          height: "90%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          filter: "blur(100px)",
          animationDelay: "-5s",
          opacity: 0.4,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "30%",
          width: "40%",
          height: "40%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

/* ── Floating particles — dust motes catching light ── */
function Particles({ reduce }: { reduce: boolean | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      opacity: number;
    }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          r: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

/* ── Noise grain overlay ── */
function NoiseOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        zIndex: 2,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/* ── Accent ruler — vertical line drawing on first paint ── */
function AccentRuler({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.span
      aria-hidden
      initial={reduce ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      style={{ transformOrigin: "top" }}
      className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-white/0 via-white/45 to-white/0"
    />
  );
}

/* ── Typewriter hook ── */
function useTypewriter(texts: string[], speed = 80, pause = 2000) {
  const [displayed, setDisplayed] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplayed(texts.join("\n"));
      return;
    }
    const current = texts[lineIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting && charIndex < current.length) {
          setDisplayed(current.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        } else if (!isDeleting && charIndex >= current.length) {
          setTimeout(() => setIsDeleting(true), pause);
        } else if (isDeleting && charIndex > 0) {
          setDisplayed(current.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        } else if (isDeleting && charIndex === 0) {
          setIsDeleting(false);
          setLineIndex((l) => (l + 1) % texts.length);
        }
      },
      isDeleting ? speed / 2 : speed
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, lineIndex, texts, speed, pause, reduce]);

  return { displayed, isTyping: !reduce };
}

/* ── Quiet field ── */
function Field({
  id,
  name,
  type,
  placeholder,
  label,
  autoComplete,
  required,
  value,
  onChange,
  error,
  inputRef,
}: {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const [focused, setFocused] = useState(false);
  const showError = Boolean(error);
  return (
    <div className="pt-7">
      <label
        htmlFor={id}
        className="block text-[10px] font-mono uppercase tracking-[0.22em] text-white/40 mb-3"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? "form-error" : undefined}
          className="w-full bg-transparent text-[15px] text-white placeholder:text-white/20 focus:outline-none py-2 font-sans transition-colors duration-300"
        />
        <div className="relative h-px w-full overflow-hidden bg-white/10">
          <div
            className={`absolute inset-0 transition-transform duration-500 ease-out ${
              showError
                ? "bg-red-400/70"
                : focused
                  ? "bg-white/70"
                  : "bg-transparent"
            }`}
            style={{
              transform:
                showError || focused
                  ? "scaleX(1)"
                  : "scaleX(0)",
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Submit button with refined micro-interaction ── */
function Submit({ reduce }: { reduce: boolean | null }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="group relative w-full h-12 mt-8 rounded-none bg-white text-black text-sm font-medium tracking-tight overflow-hidden transition-all duration-300 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {!reduce && !pending && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-black/10 to-transparent"
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </span>
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const { displayed: typedHeadline, isTyping } = useTypewriter(
    ["One gateway.", "Every model."],
    120,
    2500
  );

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#060607] text-white selection:bg-white/20 relative overflow-hidden">
      {/* ── Background layers ── */}
      <MeshOrbs reduce={reduce} />
      <Particles reduce={reduce} />
      <NoiseOverlay />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
        {/* ── LEFT: Editorial column ─────────────────────────────── */}
        <section className="relative flex flex-col justify-between p-8 lg:p-14 xl:p-20 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
          <AccentRuler reduce={reduce} />

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-white/80 hover:text-white transition-colors w-fit group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white transition-all duration-300 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:scale-110" />
              <span className="text-sm font-medium tracking-tight">Yapapa</span>
            </Link>
          </motion.div>

          {/* Headline with typewriter effect */}
          <div className="py-16 lg:py-0 max-w-xl">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.25,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-sans text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] font-medium tracking-[-0.035em] text-white"
            >
              {isTyping ? (
                <span className="block min-h-[1.1em]">
                  {typedHeadline}
                  <span className="inline-block w-[3px] h-[0.8em] bg-white/60 ml-1 animate-pulse align-middle" />
                </span>
              ) : (
                <>
                  One gateway.
                  <br />
                  Every model.
                </>
              )}
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-7 max-w-sm text-[15px] leading-relaxed text-white/45 font-sans"
            >
              Sign in to govern your keys, watch your traffic, and route to the
              right model — without leaving the dashboard.
            </motion.p>

            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="mt-10 text-sm font-sans text-white/35"
            >
              <span className="font-display italic text-white/70">100+</span>{" "}
              models{" "}
              {"  ·  "}
              <span className="font-display italic text-white/70">SSE</span>{" "}
              streaming{" "}
              {"  ·  "}
              <span className="font-display italic text-white/70">SOC 2</span>
            </motion.p>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-white/25"
          >
            <span>v3.0 · gateway</span>
            <span className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              operational
            </span>
          </motion.div>
        </section>

        {/* ── RIGHT: Form column ───────────────────────────────── */}
        <section className="relative flex items-center justify-center p-8 lg:p-12 xl:p-20">
          <div className="lg:hidden absolute top-8 left-8 z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-sm font-medium tracking-tight">Yapapa</span>
            </Link>
          </div>

          {/* Glassmorphism form card */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35,
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full max-w-[420px] relative"
          >
            {/* Glass card background */}
            <div
              className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(59,130,246,0.08) 100%)",
                maskImage:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />
            <div
              className="relative rounded-2xl px-8 py-10 lg:px-10 lg:py-12"
              style={{
                background:
                  "rgba(255,255,255,0.015)",
                backdropFilter: "blur(40px) saturate(1.1)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px -20px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className="mb-10">
                <h2 className="text-2xl font-medium tracking-tight text-white">
                  Sign in
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  Access your dashboard and API keys.
                </p>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <SocialButton provider="github" label="GitHub" />
                <SocialButton provider="google" label="Google" />
              </div>

              {/* Divider */}
              <div className="relative my-10">
                <div className="h-px w-full bg-white/[0.06]" />
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#060607] px-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">
                  or email
                </span>
              </div>

              <form action={dispatch} className="space-y-0">
                <Field
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="jane@company.com"
                  autoComplete="email"
                  required
                  inputRef={emailRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errorMessage}
                />

                <div className="pt-7">
                  <div className="flex items-center justify-between mb-3">
                    <label
                      htmlFor="password"
                      className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 hover:text-white/70 transition-colors"
                    >
                      Forgot
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(errorMessage) || undefined}
                      aria-describedby={errorMessage ? "form-error" : undefined}
                      className="peer w-full bg-transparent py-2 pr-10 font-sans text-[15px] text-white placeholder:text-white/20 focus:outline-none transition-colors duration-300"
                    />
                    <div className="relative h-px w-full overflow-hidden bg-white/10">
                      <div
                        className={`absolute inset-0 transition-transform duration-500 ease-out ${
                          errorMessage
                            ? "bg-red-400/70"
                            : "bg-white/70"
                        }`}
                        style={{
                          transform:
                            errorMessage
                              ? "scaleX(1)"
                              : "scaleX(0)",
                          transformOrigin: "left",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {errorMessage && (
                    <motion.p
                      id="form-error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      role="alert"
                      className="mt-5 flex items-center gap-2 text-[13px] text-red-300/90 font-sans"
                    >
                      <span className="h-px w-4 bg-red-400/50" />
                      {errorMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Submit reduce={reduce} />
              </form>

              <p className="mt-10 text-sm text-white/40 font-sans">
                New here?{" "}
                <Link
                  href="/signup"
                  className="text-white hover:text-white/80 underline underline-offset-[6px] decoration-white/20 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

/* ── Social button with enhanced hover state ── */
function SocialButton({
  provider,
  label,
}: {
  provider: string;
  label: string;
}) {
  return (
    <form
      action={async () => {
        await authenticateSocial(provider);
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="group w-full h-11 flex items-center justify-center gap-2.5 rounded-none bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all duration-300 text-sm text-white/70 hover:text-white relative overflow-hidden"
        style={{
          boxShadow: "none",
        }}
      >
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 50%, rgba(139,92,246,0.03) 100%)",
          }}
        />
        <span className="relative z-10 flex items-center gap-2.5">
          {provider === "github" ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          )}
          {label}
        </span>
      </Button>
    </form>
  );
}
