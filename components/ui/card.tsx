import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const cardVariants = cva(
  "rounded-[var(--radius-card)] border bg-[var(--color-surface-elevated)]",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border-default)] shadow-[var(--shadow-card)]",
        interactive:
          "border-[var(--color-border-default)] shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card-lg)]",
        muted: "border-[var(--color-border-default)] bg-[var(--color-surface)] shadow-none",
        outlined: "border-[var(--color-border-strong)] bg-transparent shadow-none",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: { variant: "default", padding: "md" },
  }
);

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
