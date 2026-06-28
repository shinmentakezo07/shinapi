"use client";

import {
  useActionState,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type CSSProperties,
} from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  Activity,
  KeyRound,
  Fingerprint,
  CheckCheck,
  Sparkles,
  Cpu,
  Network,
  Database,
  Crown,
} from "lucide-react";

import { bootstrapAdmin, type SetupState } from "@/app/lib/actions";

/* ─────────────────────── ATMOSPHERIC BACKGROUND ─────────────────────── */

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
  const duration = 14 + index * 2;
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
            ? "rgba(16,185,129,0.32)"
            : index % 3 === 1
              ? "rgba(59,130,246,0.28)"
              : "rgba(168,85,247,0.24)",
        boxShadow: `0 0 ${size * 8}px ${
          index % 3 === 0
            ? "rgba(16,185,129,0.16)"
            : index % 3 === 1
              ? "rgba(59,130,246,0.14)"
              : "rgba(168,85,247,0.13)"
        }`,
      }}
      animate={{
        y: [0, -120, -240, -360, -480],
        x: [0, (index % 2 === 0 ? 1 : -1) * 18, 0],
        opacity: [0, 0.7, 0.5, 0.25, 0],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
    />
  );
}

function ScanlineBeam() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(16,185,129,0.16), transparent)",
        boxShadow: "0 0 24px rgba(16,185,129,0.18)",
      }}
      initial={{ top: "-2%" }}
      animate={{ top: ["-2%", "102%"] }}
      transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
    />
  );
}

function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Emerald-toned radial for first-time-setup energy */}
      <div
        className="absolute -top-[30%] -right-[15%] w-[800px] h-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.025) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-[25%] -left-[15%] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.07) 0%, rgba(59,130,246,0.022) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 60%)",
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

      <ScanlineBeam />

      {Array.from({ length: 14 }).map((_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}
    </div>
  );
}

/* ─────────────────────── 3D PARALLAX TILT ─────────────────────── */

function useTilt() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const reduce = useReducedMotion();
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (reduce) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const nx = (cx / rect.width - 0.5) * 8; // ±4deg
      const ny = (cy / rect.height - 0.5) * -8; // ±4deg
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Guard against firing after unmount in case RAF was already scheduled.
        if (rafRef.current !== null) setRotation({ x: ny, y: nx });
      });
    },
    [reduce],
  );

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (rafRef.current !== null) setRotation({ x: 0, y: 0 });
    });
  }, []);

  // Cancel pending RAF on unmount so it doesn't fire setRotation on an
  // unmounted component (avoids the React-19 unmounted-update warning).
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { ref, rotation, handleMouseMove, handleMouseLeave };
}

/* ─────────────────────── DECORATION: ORBIT LOGO ─────────────────────── */

function OrbitLogo({ size = 44 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Outer rotating dotted ring */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08] shadow-lg"
        style={{
          boxShadow:
            "0 0 22px rgba(16,185,129,0.32), inset 0 0 12px rgba(16,185,129,0.06)",
        }}
        animate={reduce ? {} : { rotate: 360 }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 24, repeat: Infinity, ease: "linear" }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-blue-500/15 to-violet-500/15" />
        <img
          src="/admin-logo.jpg"
          alt="Yapapa"
          className="relative w-full h-full object-cover"
        />
      </motion.div>

      {/* Pulse ring overlay */}
      <motion.div
        className="absolute -inset-2 rounded-2xl border border-emerald-400/30 pointer-events-none"
        animate={
          reduce
            ? {}
            : { opacity: [0.3, 0, 0.3], scale: [1, 1.18, 1] }
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
      />

      {/* Orbiting dot — wraps a 0x0 pivot that rotates around the logo
          center; the inner offset positions the dot at the orbit radius
          so the rotation traces a TRUE CIRCLE (the prior 5-keyframe cos/sin
          approach interpolated linearly between corners, producing a
          square path). */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: 0,
          height: 0,
        }}
        animate={reduce ? {} : { rotate: 360 }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 5, repeat: Infinity, ease: "linear" }
        }
      >
        <div
          style={{
            position: "absolute",
            top: -(size / 2 + 8),
            left: -3,
            width: 6,
            height: 6,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 10px rgba(16,185,129,0.95)" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────── STATUS PILL + DIVIDER ─────────────────────── */

function StatusPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/[0.18] backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
      }}
    >
      <span className="relative flex h-[7px] w-[7px]">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-400" />
      </span>
      <span className="text-[11px] font-mono font-medium text-emerald-400/85 tracking-wide">
        FIRST-TIME SETUP &mdash; NO ROOT ADMIN DETECTED
      </span>
    </motion.div>
  );
}

function HorizontalDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent ${className}`}
    />
  );
}

/* ─────────────────────── 4-STEP INDICATOR ─────────────────────── */

const STEPS = [
  { label: "IDENTITY", icon: User, hint: "Name & email" },
  { label: "CREDENTIALS", icon: KeyRound, hint: "Set master password" },
  { label: "VERIFY", icon: Shield, hint: "Confirm password" },
  { label: "PROVISION", icon: Crown, hint: "Bootstrap root" },
] as const;

function StepIndicator({ active }: { active: 0 | 1 | 2 | 3 }) {
  const reduce = useReducedMotion();
  return (
    <ol
      className="grid grid-cols-4 gap-1.5"
      aria-label="Setup progress"
    >
      {STEPS.map((step, i) => {
        const isActive = i === active;
        const isPast = i < active;
        const Icon = step.icon;
        return (
          <li key={step.label} className="relative">
            <motion.div
              layout
              className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg border transition-colors duration-300 ${
                isActive
                  ? "border-emerald-500/35 bg-emerald-500/[0.07]"
                  : isPast
                    ? "border-emerald-500/15 bg-emerald-500/[0.03]"
                    : "border-white/[0.05] bg-white/[0.015]"
              }`}
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                {isPast ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? "text-emerald-400" : "text-gray-500"
                    }`}
                  />
                )}
                {isActive && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-1 ring-emerald-400/40 pointer-events-none"
                    animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                )}
              </div>
              <span
                className={`text-[8.5px] font-mono font-bold tracking-[0.14em] uppercase ${
                  isActive
                    ? "text-emerald-300/90"
                    : isPast
                      ? "text-emerald-400/65"
                      : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.div
                className={`absolute top-[18px] -right-[3px] w-[6px] h-[1px] ${
                  isPast ? "bg-emerald-400/40" : "bg-white/[0.05]"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────── PASSWORD STRENGTH METER ─────────────────────── */

type Strength = 0 | 1 | 2 | 3 | 4;

function calcStrength(pw: string): Strength {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Cap at 4 to fit a 4-bar UI
  if (score >= 5) return 4;
  return Math.max(0, Math.min(4, score)) as Strength;
}

const STRENGTH_META: Record<
  Strength,
  { label: string; color: string; hue: string; description: string }
> = {
  0: { label: "—", color: "transparent", hue: "transparent", description: "Empty" },
  1: {
    label: "WEAK",
    color: "rgba(239,68,68,0.85)",
    hue: "rgba(239,68,68,0.35)",
    description: "Use 10+ chars, mixed case, digits",
  },
  2: {
    label: "OK",
    color: "rgba(245,158,11,0.85)",
    hue: "rgba(245,158,11,0.35)",
    description: "Try adding digits or symbols",
  },
  3: {
    label: "STRONG",
    color: "rgba(16,185,129,0.85)",
    hue: "rgba(16,185,129,0.4)",
    description: "Solid master password",
  },
  4: {
    label: "EXCELLENT",
    color: "rgba(34,197,94,0.95)",
    hue: "rgba(34,197,94,0.5)",
    description: "Production-grade entropy",
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
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
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
                  i < score
                    ? `0 0 8px ${meta.hue}`
                    : "0 0 0px transparent",
              }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono font-bold tracking-[0.12em] uppercase"
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

/* ─────────────────────── INPUT FIELD ─────────────────────── */

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
      if (type === "password") setCapsLock(e.getModifierState("CapsLock"));
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
            focused ? "bg-emerald-400" : error ? "bg-red-400/60" : "bg-white/20"
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
              className="absolute -inset-[1px] rounded-xl bg-emerald-500/[0.06] blur-[6px]"
            />
          )}
        </AnimatePresence>
        <div
          className={`relative flex items-center rounded-xl border transition-all duration-250 ${
            focused
              ? "border-emerald-500/40 bg-white/[0.06] shadow-[0_0_20px_-4px_rgba(16,185,129,0.12)]"
              : error
                ? "border-red-500/40 bg-red-500/[0.03]"
                : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1]"
          }`}
        >
          <div className="flex items-center justify-center w-10 pl-3.5">
            <Icon
              className={`w-[15px] h-[15px] transition-colors duration-250 ${
                focused
                  ? "text-emerald-400"
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
                ? "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
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

/* ─────────────────────── SUBMIT BUTTON ─────────────────────── */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full h-12 rounded-xl overflow-hidden text-white font-semibold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed group/btn transition-shadow duration-300 hover:shadow-[0_8px_30px_-6px_rgba(16,185,129,0.4)] shadow-[0_4px_20px_-4px_rgba(16,185,129,0.25)]"
      style={{
        background:
          "linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #6366f1 100%)",
      }}
    >
      <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.12)_50%,transparent_75%)] bg-[length:250%_100%] group-hover/btn:animate-shimmer opacity-0 group-hover/btn:opacity-100 transition-opacity" />
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/30 rounded-tl" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/30 rounded-br" />
      <span className="relative flex items-center justify-center gap-2.5">
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Provisioning Root...</span>
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4" />
            <span>Create Admin Account</span>
          </>
        )}
      </span>
    </button>
  );
}

/* ─────────────────────── CONFETTI (success state) ─────────────────────── */

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

const CONFETTI_PALETTE = [
  "#10b981",
  "#34d399",
  "#3b82f6",
  "#60a5fa",
  "#a78bfa",
  "#c084fc",
  "#f472b6",
];

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 64 }).map((_, i) => ({
    id: i,
    angle: Math.random() * Math.PI * 2,
    distance: 180 + Math.random() * 140,
    rotation: Math.random() * 720,
    color:
      CONFETTI_PALETTE[i % CONFETTI_PALETTE.length] ?? "#10b981",
    delay: Math.random() * 0.18,
    shape:
      Math.random() < 0.4
        ? "circle"
        : Math.random() < 0.7
          ? "bar"
          : "rect",
    size: 6 + Math.random() * 6,
  }));
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
            duration: reduce ? 0 : 1.4 + Math.random() * 0.6,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            position: "absolute",
            width:
              p.shape === "bar"
                ? p.size * 0.4
                : p.shape === "circle"
                  ? p.size
                  : p.size,
            height:
              p.shape === "bar"
                ? p.size * 1.6
                : p.shape === "circle"
                  ? p.size
                  : p.size,
            background:
              p.shape === "circle" ? "transparent" : p.color,
            borderRadius:
              p.shape === "circle"
                ? "50%"
                : p.shape === "bar"
                  ? 2
                  : 2,
            border:
              p.shape === "circle"
                ? `1.5px solid ${p.color}`
                : "none",
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── SUCCESS RING (radial pulse) ─────────────────────── */

function SuccessRing() {
  return (
    <div className="relative w-32 h-32 mx-auto" aria-hidden>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.6, 2.4], opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.4, 2.0], opacity: [0, 0.55, 0] }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.18 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-400/60"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.25, 1.7], opacity: [0, 0.5, 0] }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.36 }}
      />
      <motion.div
        className="absolute inset-6 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ boxShadow: "0 0 40px rgba(16,185,129,0.55)" }}
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
  );
}

/* ─────────────────────── BRANDING PANEL ─────────────────────── */

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
      label: "Full superadmin privileges",
      sub: "Wildcard permissions granted to the new account",
    },
    {
      icon: Sparkles,
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
            "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, transparent 40%, rgba(59,130,246,0.04) 100%)",
        }}
      />
      <div className="absolute right-0 inset-y-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-10" />

      {/* Subtle vertical scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)",
        }}
      />

      <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <Link href="/" className="group inline-flex items-center gap-3.5">
            <OrbitLogo size={40} />
            <span className="text-[22px] font-bold tracking-tight text-white">
              Yapapa
            </span>
          </Link>
        </motion.div>

        <div className="max-w-lg">
          <StatusPill />

          <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-7 w-[2px] bg-gradient-to-b from-emerald-500 to-emerald-500/0 rounded-full" />
              <span className="text-[11px] font-mono text-emerald-400/60 uppercase tracking-[0.2em] font-medium">
                Bootstrap
              </span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.5rem] font-bold text-white leading-[1.15] tracking-[-0.02em] text-balance"
            >
              Initialize the
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6ee7b7 0%, #93c5fd 40%, #c084fc 100%)",
                }}
              >
                first admin
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-4 text-gray-500 text-[15px] leading-relaxed max-w-md"
            >
              No admin account exists in this database yet. Create the
              <span className="text-emerald-400/80 font-medium"> superadmin </span>
              account that will own every other admin and user going forward.
            </motion.p>
          </div>

          <div className="mt-12 space-y-2.5">
            {features.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group flex items-start gap-4 p-3 -ml-3 rounded-xl cursor-default hover:bg-white/[0.02] transition-colors duration-200"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-emerald-500/[0.08] group-hover:border-emerald-500/[0.15] transition-all duration-200 flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 transition-colors duration-200" />
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
            {["ONE-TIME", "AUDITED", "SUPERADMIN"].map((word, i) => (
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

/* ─────────────────────── SUCCESS PANEL ─────────────────────── */

function SuccessPanel({ name, email }: { name: string; email: string }) {
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
        <SuccessRing />

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-8 text-[22px] font-bold text-white tracking-tight leading-tight"
        >
          Root provisioned
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-2 text-[14px] text-gray-400 max-w-xs"
        >
          <span className="font-medium text-white">{name || email}</span>
          <span className="text-gray-600"> &mdash; </span>
          superadmin access granted. Handing off to the admin console...
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.05]"
        >
          <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400/80">
            Redirecting
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── SETUP CARD ─────────────────────── */

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
  const tilt = useTilt();

  // Phase machine: 'idle' renders the form, 'success' renders the
  // celebration panel while the redirect timer counts down.
  const [phase, setPhase] = useState<"idle" | "success">("idle");

  // bootstrapAdmin returns { success: true } on the happy path (instead of
  // server-side redirecting, so the celebration panel actually has time to
  // render before navigation). When we see that flag, flip to 'success'
  // and schedule router.push("/admin/dashboard") after ~1.6s so the
  // confetti / success-ring animations finish mid-flight.
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

  // If a new state comes back with errors after celebrating, fall back to
  // the form so the user can retry.
  useEffect(() => {
    if (
      phase === "success" &&
      (state?.message ||
        (state?.errors && Object.keys(state.errors).length > 0))
    ) {
      setPhase("idle");
    }
  }, [state, phase]);

  // Step indicator derivation: 0 identity (name+email), 1 credentials (any len),
  // 2 verify (focus or any char in confirm), 3 provision (when submit fires).
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

  // The card tilt transform is applied via inline style for performance.
  const tiltStyle: CSSProperties = reduce
    ? {}
    : {
        transform: `perspective(1200px) rotateX(${tilt.rotation.x}deg) rotateY(${tilt.rotation.y}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.18s ease-out",
      };

  const showSuccess = phase === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[440px] relative z-10"
    >
      <div className="lg:hidden mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <OrbitLogo size={32} />
          <span className="text-xl font-bold text-white tracking-tight">
            Yapapa
          </span>
        </Link>
      </div>

      <div className="relative group/card" ref={tilt.ref}>
        <div
          onMouseMove={tilt.handleMouseMove}
          onMouseLeave={tilt.handleMouseLeave}
          style={tiltStyle}
        >
          <div
            className="absolute -inset-[1px] rounded-[32px] opacity-40 blur-[2px] group-hover/card:opacity-60 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(160deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.06) 30%, transparent 50%, rgba(59,130,246,0.1) 80%, rgba(59,130,246,0.2) 100%)",
            }}
          />

          <div className="glass-card rounded-[32px] p-1 relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/[0.08] via-blue-500/[0.04] to-violet-500/[0.06]" />

            {/* HUD corner brackets */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-6 left-6 w-10 h-10 border-l border-t border-white/[0.08] rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-10 h-10 border-r border-t border-white/[0.08] rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-10 h-10 border-l border-b border-white/[0.08] rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-10 h-10 border-r border-b border-white/[0.08] rounded-br-lg" />
            </div>

            <div
              className="relative rounded-[28px] border border-white/[0.04] overflow-hidden"
              style={{ background: "rgba(10,10,10,0.97)" }}
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

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
                    className="p-6 sm:p-8"
                  >
                    <div className="flex items-center gap-3.5 mb-1">
                      <OrbitLogo size={44} />
                      <div>
                        <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                          Bootstrap Admin
                        </h1>
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25, duration: 0.4 }}
                          className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]"
                        >
                          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-mono font-bold text-emerald-400/80 tracking-[0.12em] uppercase">
                            Initial Setup
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Step indicator */}
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32, duration: 0.4 }}
                      className="mt-5"
                    >
                      <StepIndicator active={activeStep} />
                    </motion.div>

                    <HorizontalDivider className="my-4" />

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
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
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
                                Could not create admin
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
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-violet-500/10 bg-violet-500/[0.03]">
                          <Shield className="w-2.5 h-2.5 text-violet-400/70" />
                          <span className="text-[10px] font-mono text-violet-400/60 tracking-[0.06em]">
                            PG.ADVISORY
                          </span>
                        </div>
                      </motion.div>

                      <p className="text-center text-[11px] text-gray-600 font-mono mt-3">
                        <kbd className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-gray-500 text-[10px]">
                          ⌘
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

              <div
                className="h-[2px]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(16,185,129,0.3), rgba(59,130,246,0.3), rgba(99,102,241,0.2))",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {!showSuccess && (
        <div className="mt-5 space-y-3">
          <p className="text-center text-[14px] text-gray-500">
            Already initialized?{" "}
            <Link
              href="/admin/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 group transition-colors"
            >
              Sign in
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
          <div className="pt-4 border-t border-white/[0.03]">
            <p className="text-center text-[10px] text-gray-700 font-mono tracking-[0.08em] flex items-center justify-center gap-1.5">
              <Terminal className="w-3 h-3 opacity-50" />
              ONE-TIME BOOTSTRAP &bull; AUDIT LOGGED &bull; SUPERSEDED BY /admin/login
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

/* ─────────────────────── PAGE ─────────────────────── */

export default function AdminSetupPage() {
  return (
    <div
      className="h-screen overflow-hidden flex bg-[#030303] selection:bg-emerald-500/30 selection:text-white"
      style={{ position: "fixed", inset: 0, zIndex: 50 }}
    >
      <GrainOverlay />
      <AtmosphericBackground />
      <BrandingPanel />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-y-auto">
        <div
          className="absolute inset-0 lg:hidden pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, transparent 60%)",
          }}
        />
        <SetupCard />
      </div>
    </div>
  );
}
