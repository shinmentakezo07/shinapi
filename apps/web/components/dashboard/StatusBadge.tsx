"use client";

interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info";
  label: string;
  size?: "sm" | "md" | "lg";
}

const styles = {
  success: {
    bg: "bg-emerald-500/8",
    text: "text-emerald-400",
    border: "border-emerald-500/15",
    pulse: "bg-emerald-400",
  },
  error: {
    bg: "bg-red-500/8",
    text: "text-red-400",
    border: "border-red-500/15",
    pulse: "bg-red-400",
  },
  warning: {
    bg: "bg-amber-500/8",
    text: "text-amber-400",
    border: "border-amber-500/15",
    pulse: "bg-amber-400",
  },
  info: {
    bg: "bg-blue-500/8",
    text: "text-blue-400",
    border: "border-blue-500/15",
    pulse: "bg-blue-400",
  },
};

export function StatusBadge({
  status,
  label,
  size = "md",
}: StatusBadgeProps) {
  const s = styles[status];
  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono font-semibold uppercase tracking-wider ${s.bg} ${s.text} ${s.border} ${sizes[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${s.pulse} ${status === "success" ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  );
}
