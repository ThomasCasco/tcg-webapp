"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border font-medium",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border-default)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]",
        accent: "border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]",
        success: "border-transparent bg-[var(--color-success-soft)] text-[var(--color-success)]",
        warning: "border-transparent bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        danger: "border-transparent bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
        info: "border-transparent bg-[var(--color-info-soft)] text-[var(--color-info)]",
      },
      size: {
        sm: "h-6 px-2 text-[0.6875rem]",
        md: "h-7 px-3 text-[0.75rem]",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
}

export function Chip({ className, variant, size, onRemove, leftIcon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size }), className)} {...props}>
      {leftIcon}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar"
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
