import * as React from "react";
import { cn } from "@/lib/ui/cn";

const selectClass =
  "h-11 w-full appearance-none rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 pr-9 text-[0.9375rem] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(selectClass, className)} {...props}>
      {children}
    </select>
    <svg
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
));
Select.displayName = "Select";
