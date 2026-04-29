import * as React from "react";
import { cn } from "@/lib/ui/cn";

const sizeClasses = {
  sm: "h-6 w-6 text-[0.625rem]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-sm",
};

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent-strong)]",
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
