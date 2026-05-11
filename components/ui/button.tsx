"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { Loader2 } from "@/components/ui/icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-ink)] text-white hover:bg-black",
        secondary: "border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]",
        ghost: "text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]",
        danger: "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90",
        link: "text-[var(--color-ink)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
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
