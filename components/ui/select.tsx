import * as React from "react";
import { cn } from "@/lib/ui/cn";

const selectClass =
  "h-11 w-full appearance-none rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-md px-3.5 pr-9 text-[0.9375rem] text-[var(--ink)] focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-glow),0.35)] disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

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
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
));
Select.displayName = "Select";
