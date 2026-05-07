import * as React from "react";
import { cn } from "@/lib/ui/cn";

const textareaClass =
  "min-h-[96px] w-full resize-y rounded-[var(--radius-input)] border-0 bg-[var(--color-input-fill)] px-4 py-3 text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] transition-all duration-150 focus:bg-[var(--color-input-fill-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/30 disabled:cursor-not-allowed disabled:opacity-50";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaClass, className)} {...props} />
));
Textarea.displayName = "Textarea";
