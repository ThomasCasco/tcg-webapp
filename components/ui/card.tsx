import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const cardVariants = cva(
  "rounded-xl border bg-white",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border)] shadow-sm",
        interactive:
          "border-[var(--color-border)] shadow-sm transition-all hover:border-[var(--color-ink)] hover:shadow-md",
        muted: "border-[var(--color-border)] bg-[var(--color-surface-muted)] shadow-none",
        outlined: "border-[var(--color-border-strong)] bg-transparent shadow-none",
      },
      padding: {
        none: "",
        sm: "p-4",
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
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex flex-wrap items-center gap-2", className)} {...props} />;
}
