"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { Loader2 } from "@/components/ui/icon";

const buttonVariants = cva(
  "btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-0)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "btn-primary",
        secondary: "btn-ghost",
        ghost: "btn-ghost border-transparent bg-transparent hover:bg-[var(--glass-fill)]",
        danger:
          "text-white border-0 [background:linear-gradient(180deg,#FF8090,#FF5566)] [box-shadow:0_0_0_1px_rgba(255,255,255,0.18)_inset,0_10px_28px_rgba(255,85,102,0.45)]",
        link: "text-[var(--accent-hi)] underline-offset-4 hover:underline px-1 py-0 [box-shadow:none]",
        icon: "btn-icon",
      },
      size: {
        sm: "min-h-9 px-3 py-1.5 text-[0.8125rem]",
        md: "min-h-11 px-4 py-2.5 text-[0.9375rem]",
        lg: "min-h-12 px-6 py-3 text-[1.0625rem]",
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
