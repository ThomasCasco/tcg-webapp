import * as React from "react";
import { cn } from "@/lib/ui/cn";

const textareaClass =
  "min-h-[88px] w-full rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaClass, className)} {...props} />
));
Textarea.displayName = "Textarea";
