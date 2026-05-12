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
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-2", className)}>
      <span className="t-eyebrow">
        {label}
        {required && <span className="ml-1 text-[#FF8090]">*</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-[0.75rem] text-[#FF8090]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[0.75rem] text-[var(--ink-soft)]">{hint}</span>
      ) : null}
    </label>
  );
}
