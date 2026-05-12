import * as React from "react";
import { cn } from "@/lib/ui/cn";

export const inputClass =
  "h-11 w-full rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-md px-3.5 text-[0.9375rem] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-glow),0.35)] disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  )
);
Input.displayName = "Input";
