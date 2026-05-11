import * as React from "react";
import { cn } from "@/lib/ui/cn";

export const inputClass =
  "h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/10 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  )
);
Input.displayName = "Input";
