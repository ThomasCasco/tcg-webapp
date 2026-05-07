import * as React from "react";
import { cn } from "@/lib/ui/cn";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className={cn("inline-flex cursor-pointer items-center gap-3", className)}
    >
      {label && (
        <span className="text-[0.9375rem] text-[var(--color-ink)]">{label}</span>
      )}
      <div className="relative inline-flex shrink-0">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        {/* Track */}
        <div className="h-[31px] w-[51px] rounded-full bg-[#e5e5ea] transition-colors duration-200 peer-checked:bg-[#34c759] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-focus-ring)] peer-focus-visible:ring-offset-2 peer-disabled:opacity-50" />
        {/* Thumb */}
        <div className="pointer-events-none absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform duration-200 peer-checked:translate-x-5" />
      </div>
    </label>
  )
);
Switch.displayName = "Switch";
