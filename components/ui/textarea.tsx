import * as React from "react";
import { cn } from "@/lib/ui/cn";

const textareaClass =
  "min-h-[88px] w-full rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-md px-3.5 py-2.5 text-[0.9375rem] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-glow),0.35)] disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaClass, className)} {...props} />
));
Textarea.displayName = "Textarea";
