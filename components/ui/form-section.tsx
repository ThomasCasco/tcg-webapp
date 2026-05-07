import * as React from "react";
import { cn } from "@/lib/ui/cn";

interface FormSectionProps {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, hint, children, className }: FormSectionProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {title && (
        <p className="mb-1.5 ml-4 text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
          {title}
        </p>
      )}
      <div className="overflow-hidden rounded-[var(--radius-section)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card-sm)] divide-y divide-[var(--color-border-subtle)]">
        {children}
      </div>
      {hint && (
        <p className="mt-1.5 ml-4 text-[0.75rem] text-[var(--color-ink-subtle)]">{hint}</p>
      )}
    </div>
  );
}

interface FormRowProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ label, htmlFor, required, error, children, className }: FormRowProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className={cn(
          "flex min-h-[3.25rem] cursor-pointer items-center gap-3 px-4 transition-colors duration-100 focus-within:bg-[var(--color-input-fill)]",
          className
        )}
      >
        <span className="w-28 shrink-0 text-[0.9375rem] text-[var(--color-ink)]">
          {label}
          {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
        </span>
        <div className="flex flex-1 items-center justify-end">
          {children}
        </div>
      </label>
      {error && (
        <p role="alert" className="px-4 pb-2 text-[0.75rem] text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
