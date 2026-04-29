import * as React from "react";
import { cn } from "@/lib/ui/cn";

export const inputClass =
  "h-11 w-full rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  )
);
Input.displayName = "Input";
