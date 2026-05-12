"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

const chipVariants = cva("chip", {
  variants: {
    variant: {
      default: "",
      active: "chip-active",
      accent: "chip-soft",
      success: "chip-success",
      warning: "chip-warning",
      danger: "chip-danger",
      info: "chip-info",
    },
    size: {
      sm: "text-[0.6875rem] px-2 py-1",
      md: "",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

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
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
