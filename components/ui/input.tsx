import * as React from "react";
import { cn } from "@/lib/ui/cn";

export const inputClass =
  "h-12 w-full rounded-[var(--radius-input)] border-0 bg-[var(--color-input-fill)] px-4 text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] transition-all duration-150 focus:bg-[var(--color-input-fill-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/30 disabled:cursor-not-allowed disabled:opacity-50";

export const ghostInputClass =
  "h-full min-h-[3rem] w-full border-0 bg-transparent px-0 py-2 text-right text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <input
      ref={ref}
      className={cn(variant === "ghost" ? ghostInputClass : inputClass, className)}
      {...props}
    />
  )
);
Input.displayName = "Input";
