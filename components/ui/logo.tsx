"use client";

import { cn } from "@/lib/ui/cn";

type Props = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animated?: boolean;
};

export function Logo({ size = "md", showText = true, className, animated = false }: Props) {
  const sizes = {
    sm: { icon: "h-8 w-8", text: "text-lg", pokeball: 14 },
    md: { icon: "h-10 w-10", text: "text-xl", pokeball: 18 },
    lg: { icon: "h-14 w-14", text: "text-3xl", pokeball: 26 },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          s.icon,
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] shadow-lg",
          animated && "animate-pulse-glow"
        )}
      >
        {/* Pokeball-inspired icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[60%] h-[60%]"
        >
          {/* Top half */}
          <path
            d="M16 2C8.268 2 2 8.268 2 16h28c0-7.732-6.268-14-14-14z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Bottom half */}
          <path
            d="M2 16c0 7.732 6.268 14 14 14s14-6.268 14-14H2z"
            fill="white"
            fillOpacity="0.3"
          />
          {/* Center line */}
          <rect x="2" y="14" width="28" height="4" fill="white" fillOpacity="0.5" />
          {/* Center circle outer */}
          <circle cx="16" cy="16" r="6" fill="white" fillOpacity="0.95" />
          {/* Center circle inner */}
          <circle cx="16" cy="16" r="3" fill="var(--color-primary-strong)" />
          {/* Shine effect */}
          <ellipse cx="10" cy="10" rx="3" ry="2" fill="white" fillOpacity="0.4" transform="rotate(-30 10 10)" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            s.text,
            "font-bold tracking-tight [font-family:var(--font-display)]"
          )}
        >
          <span className="text-[var(--color-primary)]">TCG</span>
          <span className="text-[var(--color-ink)]">.ar</span>
        </span>
      )}
    </div>
  );
}
