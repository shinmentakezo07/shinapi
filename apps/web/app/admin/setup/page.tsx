"use client";

import {
  useActionState,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useFormStatus } from "react-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  ChevronRight,
  Terminal,
  User,
  KeyRound,
  Fingerprint,
  CheckCheck,
  Cpu,
  Database,
  Network,
  Activity,
} from "lucide-react";

import { bootstrapAdmin, type SetupState } from "@/app/lib/actions";

/* ════════════════════════════════════════════════════════════════════════
   ATMOSPHERIC BACKGROUND  (mirrors admin/login for family parity)
   ════════════════════════════════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

function FloatingParticle({ index }: { index: number }) {
  const duration = 10 + index * 2;
  const delay = index * 0.6;
  const x = 5 + ((index * 13) % 90);
  const size = 1.5 + (index % 4) * 0.4;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: "-10%",
        background:
          index % 3 === 0
            ? "rgba(59,130,246,0.3)"
            : index % 3 === 1
              ? "rgba(139,92,246,0.25)"
              : "rgba(168,85,247,0.2)",
        boxShadow: `0 0 ${size * 6}px ${
          index % 3 === 0
            ? "rgba(59,130,246,0.12)"
            : index % 3 === 1
              ? "rgba(139,92,246,0.1)"
              : "rgba(168,85,247,0.1)"
        }`,
      }}
      animate={{
        y: [0, -120, -240, -360, -480],
        x: [0, (index % 2 === 0 ? 1 : -1) * 15, 0],
        opacity: [0, 0.6, 0.4, 0.2, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
    />
  );
}

function AtmosphericBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute -top-[30%] -right-[15%] w-[800px] h-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-[25%] -left-[15%] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.05) 0%, rgba(124,58,237,0.015) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(168,85,247,0.025) 0%, transparent 60%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {Array.from({ length: 12 }).map((_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}
    </div>
  );
}

function DynamicSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  useEffect(() => {
    const h = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [mouseX, mouseY]);
  return (
    <motion.div
      className="absolute inset-0 opacity-40 pointer-events-none"
      style={{
        background: useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.08), transparent 80%)`,
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════
   HORIZONTAL DIVIDER  (matches admin/login)
   ════════════════════════════════════════════════════════════════════════ */

function HorizontalDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent ${className}`}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════
   STATUS INDICATOR  (parity with admin/login)
   ════════════════════════════════════════════════════════════════════════ */

function StatusIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/[0.15] backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))",
      }}
    >
      <span className="relative flex h-[7px] w-[7px]">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-400" />
      </span>
      <span className="text-[11px] font-mono font-medium text-emerald-400/80 tracking-wide">
        ROOT SLOT UNCLAIMED &middot; AWAITING BOOTSTRAP
      </span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LOGO  (parity with admin/login)
   ════════════════════════════════════════════════════════════════════════ */

function YapapaLogo({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3.5">
      <div className="relative">
        <div
          className="rounded-xl overflow-hidden ring-1 ring-white/[0.08] shadow-lg shadow-blue-500/20"
          style={{ width: size, height: size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nervous-cat.jpg"
            alt="Yapapa"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -inset-1.5 rounded-xl bg-blue-500/15 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
      </div>
      <span className="text-[22px] font-bold tracking-tight text-white">
        Yapapa
      </span>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   STEP INDICATOR  (4-step wizard with brand palette)
   ════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  { label: "IDENTITY", icon: User, hint: "name" },
  { label: "ACCESS", icon: Mail, hint: "email" },
  { label: "PASSWORD", icon: KeyRound, hint: "secret" },
  { label: "CONFIRM", icon: Shield, hint: "verify" },
] as const;

function CyberStepIndicator({ active }: { active: 0 | 1 | 2 | 3 }) {
  const reduce = useReducedMotion();
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Setup progress">
      {STEPS.map((step, i) => {
        const isActive = i === active;
        const isPast = i < active;
        const Icon = step.icon;
        return (
          <li key={step.label} className="relative">
            <div
              className={`flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-md border transition-all duration-300 ${
                isActive
                  ? "border-blue-500/40 bg-blue-500/[0.06]"
                  : isPast
                    ? "border-blue-500/20 bg-blue-500/[0.025]"
                    : "border-white/[0.05] bg-white/[0.015]"
              }`}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                {isPast ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? "text-blue-400" : "text-gray-500"
                    }`}
                  />
                )}
                {isActive && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-1 ring-blue-400/40 pointer-events-none"
                    animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.6, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
              </div>
              <span
                className={`text-[8px] font-mono font-bold tracking-[0.14em] uppercase ${
                  isActive
                    ? "text-blue-400/90"
                    : isPast
                      ? "text-blue-400/60"
                      : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PASSWORD STRENGTH METER  (blue → violet ramp, matches brand)
   ════════════════════════════════════════════════════════════════════════ */

type Strength = 0 | 1 | 2 | 3 | 4;

function calcStrength(pw: string): Strength {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score > 4) return 4;
  return Math.max(0, Math.min(4, score)) as Strength;
}

const STRENGTH_META: Record<
  Strength,
  { label: string; color: string; glow: string; description: string }
> = {
  0: {
    label: "—",
    color: "transparent",
    glow: "transparent",
    description: "awaiting input",
  },
  1: {
    label: "WEAK",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
    description: "use 10+ chars, mixed case, digits",
  },
  2: {
    label: "OK",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.5)",
    description: "try adding digits or symbols",
  },
  3: {
    label: "STRONG",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.55)",
    description: "solid master password",
  },
  4: {
    label: "EXCELLENT",
    color: "#10b981",
    glow: "rgba(16,185,129,0.6)",
    description: "production-grade entropy",
  },
};

function PasswordStrengthMeter({ password }: { password: string }) {
  const score = calcStrength(password);
  const meta = STRENGTH_META[score];
  return (
    <div
      className="mt-2 space-y-1.5"
      aria-live="polite"
      aria-label={`Password strength: ${meta.label}`}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: meta.color }}
              animate={{
                width: i < score ? "100%" : "0%",
                boxShadow:
                  i < score ? `0 0 8px ${meta.glow}` : "0 0 0px transparent",
              }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono font-bold tracking-[0.14em] uppercase"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[10px] font-mono text-gray-600 tracking-[0.04em]">
          {meta.description}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   INPUT FIELD  (parity with admin/login input style)
   ════════════════════════════════════════════════════════════════════════ */

function InputField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  error,
  autoFocus,
  showToggle,
  onToggleShow,
  isVisible,
  bottomSlot,
}: {
  id: string;
  label: string;
  type: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete: string;
  icon: React.ElementType;
  error?: string;
  autoFocus?: boolean;
  showToggle?: boolean;
  onToggleShow?: () => void;
  isVisible?: boolean;
  bottomSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (type === "password") {
        setCapsLock(e.getModifierState("CapsLock"));
      }
    },
    [type],
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-gray-400"
      >
        <span
          className={`w-[3px] h-[3px] rounded-full transition-colors duration-300 ${
            focused ? "bg-blue-400" : error ? "bg-red-400/60" : "bg-white/20"
          }`}
        />
        {label}
      </label>

      <div className="relative">
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute -inset-[1px] rounded-xl bg-blue-500/[0.06] blur-[6px]"
            />
          )}
        </AnimatePresence>

        <div
          className={`relative flex items-center rounded-xl border transition-all duration-250 ${
            focused
              ? "border-blue-500/40 bg-white/[0.06] shadow-[0_0_20px_-4px_rgba(59,130,246,0.12)]"
              : error
                ? "border-red-500/40 bg-red-500/[0.03]"
                : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1]"
          }`}
        >
          <div className="flex items-center justify-center w-10 pl-3.5">
            <Icon
              className={`w-[15px] h-[15px] transition-colors duration-250 ${
                focused
                  ? "text-blue-400"
                  : error
                    ? "text-red-400/70"
                    : "text-gray-500/70"
              }`}
            />
          </div>

          <input
            id={id}
            name={id}
            type={showToggle && isVisible ? "text" : type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            required
            autoFocus={autoFocus}
            minLength={type === "password" ? 6 : undefined}
            autoComplete={autoComplete}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className="w-full h-12 pr-10 bg-transparent text-white text-[14px] placeholder:text-gray-600/70 focus:outline-none"
          />

          {showToggle && (
            <button
              type="button"
              onClick={onToggleShow}
              tabIndex={-1}
              className="flex items-center justify-center w-10 pr-3 text-gray-500/60 hover:text-gray-300 transition-colors"
              aria-label={isVisible ? "Hide password" : "Show password"}
            >
              {isVisible ? (
                <EyeOff className="w-[15px] h-[15px]" />
              ) : (
                <Eye className="w-[15px] h-[15px]" />
              )}
            </button>
          )}

          <div
            className={`absolute bottom-0 left-3 right-3 h-[1px] transition-all duration-300 ${
              focused
                ? "bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
                : "bg-transparent"
            }`}
          />
        </div>

        <AnimatePresence>
          {capsLock && type === "password" && focused && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1.5 text-[11px] font-mono text-amber-400/70 pl-1"
            >
              Caps Lock is on
            </motion.p>
          )}
        </AnimatePresence>
        {bottomSlot}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SUBMIT BUTTON  (parity with admin/login submit — rounded gradient)
   ════════════════════════════════════════════════════════════════════════ */

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full h-12 rounded-xl overflow-hidden text-white font-semibold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed group/btn transition-shadow duration-300 hover:shadow-[0_8px_30px_-6px_rgba(59,130,246,0.4)] shadow-[0_4px_20px_-4px_rgba(59,130,246,0.25)]"
      style={{
        background:
          "linear-gradient(135deg, #3b82f6 0%, #7c3aed 50%, #6d28d9 100%)",
      }}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/30 rounded-tl" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/30 rounded-br" />

      <span className="relative flex items-center justify-center gap-2.5">
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Provisioning&hellip;</span>
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4" />
            <span>Bootstrap Superadmin</span>
          </>
        )}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CONFETTI BURST  (blue / violet / emerald, no pink)
   ════════════════════════════════════════════════════════════════════════ */

type ConfettiPiece = {
  id: number;
  angle: number;
  distance: number;
  rotation: number;
  color: string;
  delay: number;
  shape: "rect" | "circle" | "bar";
  size: number;
};

const CONFETTI_PALETTE = ["#3b82f6", "#7c3aed", "#a855f7", "#10b981"];

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 60 }).map((_, i) => {
    const seed = i * 9301 + 49297;
    const r1 = ((seed * 233280) % 1000) / 1000;
    const r2 = ((seed * 12345) % 1000) / 1000;
    const r3 = ((seed * 7777) % 1000) / 1000;
    return {
      id: i,
      angle: r1 * Math.PI * 2,
      distance: 180 + r2 * 160,
      rotation: r3 * 720,
      color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length] ?? "#3b82f6",
      delay: r1 * 0.18,
      shape: r2 < 0.4 ? "circle" : r2 < 0.7 ? "bar" : "rect",
      size: 5 + r3 * 7,
    };
  });
}

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo(() => makeConfetti(), []);
  const reduce = useReducedMotion();
  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={
            active && !reduce
              ? {
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  opacity: 0,
                  rotate: p.rotation,
                }
              : { opacity: 0 }
          }
          transition={{
            duration: reduce ? 0 : 1.4 + p.delay * 1.5,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            position: "absolute",
            width: p.shape === "bar" ? p.size * 0.4 : p.size,
            height: p.shape === "bar" ? p.size * 1.6 : p.size,
            background: p.shape === "circle" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : 2,
            border: p.shape === "circle" ? `1.5px solid ${p.color}` : "none",
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SUCCESS PANEL  (blue/violet/emerald pulses)
   ════════════════════════════════════════════════════════════════════════ */

function SuccessPanel({ name, email }: { name: string; email: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[440px] mx-auto"
      role="status"
      aria-live="polite"
    >
      <ConfettiBurst active />
      <div className="relative flex flex-col items-center justify-center py-10 px-6 text-center">
        <div className="relative w-32 h-32 mx-auto" aria-hidden>
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: "rgba(124,58,237,0.4)" }}
          />
          {!reduce && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: "#7c3aed" }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.6, 2.4], opacity: [0, 0.7, 0] }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: "#3b82f6" }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.4, 2], opacity: [0, 0.55, 0] }}
                transition={{
                  duration: 1.4,
                  ease: "easeOut",
                  delay: 0.18,
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: "#10b981" }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.25, 1.7], opacity: [0, 0.5, 0] }}
                transition={{
                  duration: 1.4,
                  ease: "easeOut",
                  delay: 0.36,
                }}
              />
            </>
          )}
          <motion.div
            className="absolute inset-6 rounded-full flex items-center justify-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #7c3aed 50%, #6d28d9 100%)",
              boxShadow: "0 0 40px rgba(124,58,237,0.55)",
            }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <CheckCheck className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-8 text-[20px] font-bold text-white tracking-tight"
          style={{ textShadow: "0 0 8px rgba(124,58,237,0.4)" }}
        >
          Superadmin Provisioned
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-3 text-[13px] text-gray-400 max-w-xs leading-relaxed"
        >
          <span className="text-white font-medium">{name || email}</span> now
          holds the root admin role with full permissions. You&rsquo;ll be
          handed off to the admin console in a moment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/[0.05]"
        >
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-blue-400/85">
            Redirecting&hellip;
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   BRANDING PANEL  (left ~52% — parity with admin/login)
   ════════════════════════════════════════════════════════════════════════ */

function BrandingPanel() {
  const features = [
    {
      icon: Database,
      label: "Lock-step initialization",
      sub: "Single transaction installs the superadmin row",
    },
    {
      icon: Network,
      label: "Advisory-locked concurrency",
      sub: "Racing bootstrap attempts serialize at the DB",
    },
    {
      icon: Cpu,
      label: "Wildcard permissions",
      sub: "Superadmin starts with full admin_users perms",
    },
    {
      icon: Activity,
      label: "Auto-login & handoff",
      sub: "Hands you the keys to the admin console",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.03) 0%, transparent 40%, rgba(124,58,237,0.02) 100%)",
        }}
      />

      <div className="absolute right-0 inset-y-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-10" />

      <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <YapapaLogo size={36} />
        </motion.div>

        <div className="max-w-lg">
          <StatusIndicator />

          <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-7 w-[2px] bg-gradient-to-b from-blue-500 to-blue-500/0 rounded-full" />
              <span className="text-[11px] font-mono text-blue-400/60 uppercase tracking-[0.2em] font-medium">
                First-time setup
              </span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-[2.5rem] font-bold text-white leading-[1.15] tracking-[-0.02em] text-balance"
            >
              Initialize the
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #93c5fd 0%, #a78bfa 40%, #c084fc 100%)",
                }}
              >
                root account
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-4 text-gray-500 text-[15px] leading-relaxed max-w-md"
            >
              Provision the first superadmin that owns every subsequent admin
              account. This bootstrap is one-shot and superseded by{" "}
              <span className="text-blue-400/80 font-medium">/admin/login</span>{" "}
              once the root row exists.
            </motion.p>
          </div>

          <div className="mt-12 space-y-2.5">
            {features.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.4 + i * 0.08,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group flex items-start gap-4 p-3 -ml-3 rounded-xl cursor-default hover:bg-white/[0.02] transition-colors duration-200"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-blue-500/[0.08] group-hover:border-blue-500/[0.15] transition-all duration-200 flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors duration-200" />
                </div>
                <div>
                  <p className="text-white/90 text-[13px] font-medium leading-tight">
                    {item.label}
                  </p>
                  <p className="text-gray-600 text-[12px] mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-end text-[10px] font-mono text-gray-700 tracking-wide"
        >
          <span>&copy; 2026 YAPAPA</span>
          <div className="flex items-center gap-3">
            {["PROVISION", "AUDITED", "SUPERADMIN"].map((word, i) => (
              <span key={word} className="flex items-center gap-3">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-800" />}
                <span className="hover:text-gray-500 transition-colors cursor-default">
                  {word}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SETUP CARD  (right ~48% — glass-card pattern from admin/login)
   ════════════════════════════════════════════════════════════════════════ */

function SetupCard() {
  const router = useRouter();
  const [state, dispatch] = useActionState<SetupState | undefined, FormData>(
    bootstrapAdmin,
    undefined,
  );
  const { pending } = useFormStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState<"idle" | "success">("idle");

  useEffect(() => {
    if (state?.success && phase !== "success") {
      setPhase("success");
      const timer = window.setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1600);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state, phase, router]);

  useEffect(() => {
    if (
      phase === "success" &&
      (state?.message ||
        (state?.errors && Object.keys(state.errors).length > 0))
    ) {
      setPhase("idle");
    }
  }, [state, phase]);

  // The server action sets `state.redirectTo` (instead of calling
  // `redirect()`) when the operation needs to hand off navigation to
  // the client. We handle the navigation in this effect, which keeps
  // the action purely result-typed. This avoids Next.js 16 canary's
  // "An unexpected response was received from the server" runtime error
  // that `redirect()` from inside a useActionState action can trip.
  useEffect(() => {
    if (state?.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [state, router]);

  const activeStep: 0 | 1 | 2 | 3 = pending
    ? 3
    : confirmPassword.length > 0 || password.length > 0
      ? 2
      : password.length > 0 || email.length > 0
        ? 1
        : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && phase === "idle") {
        const form = document.querySelector("form");
        if (form) form.requestSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]);

  const nameErr = state?.errors?.name?.[0];
  const emailErr = state?.errors?.email?.[0];
  const pwErr = state?.errors?.password?.[0];
  const confirmErr = state?.errors?.confirmPassword?.[0];
  const topMessage = state?.message ?? null;

  const showSuccess = phase === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[460px] relative z-10"
    >
      {/* Mobile logo */}
      <div className="lg:hidden mb-6">
        <YapapaLogo size={32} />
      </div>

      <div className="relative">
        {/* Outer glow */}
        <div
          className="absolute -inset-[1px] rounded-[32px] opacity-40 blur-[2px]"
          style={{
            background:
              "linear-gradient(160deg, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.06) 30%, transparent 50%, rgba(124,58,237,0.1) 80%, rgba(124,58,237,0.2) 100%)",
          }}
        />

        {/* Glass card outer — 32px radius */}
        <div className="glass-card rounded-[32px] p-1 relative overflow-hidden">
          {/* HUD corner brackets */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-6 left-6 w-10 h-10 border-l border-t border-white/[0.08] rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-10 h-10 border-r border-t border-white/[0.08] rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-10 h-10 border-l border-b border-white/[0.08] rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-10 h-10 border-r border-b border-white/[0.08] rounded-br-lg" />
          </div>

          {/* Inner content — 28px radius */}
          <div
            className="relative rounded-[28px] border border-white/[0.04] overflow-hidden"
            style={{ background: "rgba(10,10,10,0.97)" }}
          >
            {/* Top accent bar */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

            <AnimatePresence mode="wait" initial={false}>
              {showSuccess ? (
                <SuccessPanel key="success" name={name} email={email} />
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 sm:p-8 relative"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3.5 mb-1">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-1 ring-white/[0.08] shadow-lg shadow-blue-500/20 flex-shrink-0 group-hover:shadow-blue-500/30 transition-shadow duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/10" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/nervous-cat.jpg"
                        alt="Yapapa"
                        className="relative w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                        Root Bootstrap
                      </h1>
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06]"
                      >
                        <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-amber-400/80 tracking-[0.12em] uppercase">
                          One-time Setup
                        </span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Step indicator */}
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32, duration: 0.4 }}
                    className="mt-4 mb-5"
                  >
                    <CyberStepIndicator active={activeStep} />
                  </motion.div>

                  <HorizontalDivider className="my-4" />

                  {/* Form */}
                  <form action={dispatch} className="space-y-4">
                    <InputField
                      id="name"
                      label="Display Name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      icon={User}
                      autoFocus
                      error={nameErr}
                    />

                    <InputField
                      id="email"
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@company.com"
                      autoComplete="email"
                      icon={Mail}
                      error={emailErr ? " " : undefined}
                    />

                    <InputField
                      id="password"
                      label="Master Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      icon={Lock}
                      showToggle
                      isVisible={showPassword}
                      onToggleShow={() => setShowPassword(!showPassword)}
                      error={pwErr ? " " : undefined}
                      bottomSlot={<PasswordStrengthMeter password={password} />}
                    />

                    <InputField
                      id="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      icon={Shield}
                      showToggle
                      isVisible={showConfirm}
                      onToggleShow={() => setShowConfirm(!showConfirm)}
                      error={confirmErr}
                    />

                    <AnimatePresence>
                      {topMessage && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                            marginTop: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                            marginTop: 16,
                          }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/[0.15]"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
                          }}
                          role="alert"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400 text-[13px] font-medium">
                              Bootstrap failed
                            </p>
                            <p className="text-red-400/50 text-[12px] mt-0.5">
                              {topMessage}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-2">
                      <SubmitButton />
                    </div>

                    {/* Security indicator (parity with admin/login) */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="flex items-center justify-center gap-3 mt-3"
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/10 bg-emerald-500/[0.03]">
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-400/60 tracking-[0.06em]">
                          TLS 1.3
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/10 bg-blue-500/[0.03]">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        <span className="text-[10px] font-mono text-blue-400/60 tracking-[0.06em]">
                          ARGON2ID
                        </span>
                      </div>
                    </motion.div>

                    {/* Keyboard shortcut hint */}
                    <p className="text-center text-[11px] text-gray-600 font-mono mt-3">
                      <kbd className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-gray-500 text-[10px]">
                        &#8984;
                      </kbd>
                      {" + "}
                      <kbd className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-gray-500 text-[10px]">
                        Enter
                      </kbd>
                      {" to submit"}
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom accent bar */}
            <div
              className="h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {!showSuccess && (
        <div className="mt-5 space-y-3">
          <p className="text-center text-[14px] text-gray-500">
            Already initialized?{" "}
            <Link
              href="/admin/login"
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 group transition-colors"
            >
              Sign in
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>

          <div className="pt-4 border-t border-white/[0.03]">
            <p className="text-center text-[10px] text-gray-700 font-mono tracking-[0.08em] flex items-center justify-center gap-1.5">
              <Terminal className="w-3 h-3 opacity-50" />
              ONE-TIME BOOTSTRAP &bull; AUDIT LOGGED &bull; SUPERSEDED BY
              /admin/login
            </p>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="mt-5 space-y-3">
          <div className="pt-4 border-t border-white/[0.03]">
            <p className="text-center text-[10px] text-gray-700 font-mono tracking-[0.08em] flex items-center justify-center gap-1.5">
              <Fingerprint className="w-3 h-3 opacity-50" />
              ADMIN SESSION ESTABLISHED &bull; SUPERADMIN PRIVILEGES GRANTED
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════ */

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-[#030303] selection:bg-blue-500/30 selection:text-white relative overflow-hidden">
      <DynamicSpotlight />
      <GrainOverlay />
      <AtmosphericBackground />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        <BrandingPanel />

        {/* Vertical separator (parity with admin/login) */}
        <div className="hidden lg:block relative w-px">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-b from-blue-500/20 via-violet-500/20 to-transparent rounded-full blur-sm" />
        </div>

        {/* Right: Setup form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
          <div
            className="absolute inset-0 lg:hidden pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 60%)",
            }}
          />

          <SetupCard />
        </div>
      </div>
    </div>
  );
}
