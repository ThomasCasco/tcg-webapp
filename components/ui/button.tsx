"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { Loader2 } from "@/components/ui/icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] border border-transparent font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-[var(--color-ink-inverse)] shadow-sm hover:bg-[var(--color-accent-strong)]",
        secondary: "border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-ink-inverse)]",
        ghost: "text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5",
        danger: "bg-[var(--color-danger)] text-[var(--color-ink-inverse)] shadow-sm hover:bg-[var(--color-danger)]/90",
        link: "text-[var(--color-accent-strong)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-[0.8125rem]",
        md: "h-11 px-4 text-[0.9375rem]",
        lg: "h-14 px-8 text-[1.0625rem]",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, asChild, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const inner = asChild ? (
      children
    ) : (
      <>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </>
    );
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {inner}
      </Comp>
    );
  }
);
Button.displayName = "Button";
