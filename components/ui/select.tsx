import * as React from "react";
import { cn } from "@/lib/ui/cn";

const selectClass =
  "h-12 w-full appearance-none rounded-[var(--radius-input)] border-0 bg-[var(--color-input-fill)] px-4 pr-10 text-[0.9375rem] text-[var(--color-ink)] transition-all duration-150 focus:bg-[var(--color-input-fill-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/30 disabled:cursor-not-allowed disabled:opacity-50";

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
