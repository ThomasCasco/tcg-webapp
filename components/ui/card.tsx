import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const cardVariants = cva("", {
  variants: {
    variant: {
      default: "glass",
      interactive:
        "glass transition-[transform,box-shadow] hover:-translate-y-0.5 hover:[box-shadow:0_1px_0_rgba(255,255,255,0.06)_inset,0_30px_70px_rgba(0,0,0,0.65)]",
      muted: "glass-soft",
      outlined: "rounded-[var(--r-md)] border border-[var(--glass-border-hi)] bg-transparent",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-5",
      lg: "p-6",
    },
  },
  defaultVariants: { variant: "default", padding: "md" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof cardVariants> {
  as?: "div" | "article" | "section" | "header" | "main";
}

export function Card({ as: Tag = "div", className, variant, padding, ...props }: CardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return <T className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-wrap items-center gap-2", className)} {...props} />;
}
