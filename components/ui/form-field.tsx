import * as React from "react";
import { cn } from "@/lib/ui/cn";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[0.8125rem] font-medium text-[var(--color-ink)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-[0.75rem] text-[var(--color-danger)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[0.75rem] text-[var(--color-ink-subtle)]">{hint}</span>
      ) : null}
    </label>
  );
}
