import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/ui/cn";

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full text-white",
          "[background:linear-gradient(180deg,var(--accent-hi),var(--accent))]",
          "[box-shadow:var(--shadow-fab)]",
          "transition-transform active:scale-95",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Fab.displayName = "Fab";
