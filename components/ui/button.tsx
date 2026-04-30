"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { Loader2 } from "@/components/ui/icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-[var(--color-ink-inverse)] hover:bg-[var(--color-accent-strong)]",
        secondary: "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] hover:bg-[var(--color-accent-soft)]/80",
        ghost: "text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5",
        danger: "bg-[var(--color-danger)] text-[var(--color-ink-inverse)] hover:bg-[var(--color-danger)]/90",
        link: "text-[var(--color-accent-strong)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-[0.8125rem]",
        md: "h-11 px-4 text-[0.9375rem]",
        lg: "h-12 px-6 text-[1.0625rem]",
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
    // Slot (asChild) requires exactly one React element child — pass children through directly.
    // Icons/loading are only injected when rendering a real <button>.
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
