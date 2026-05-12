import { cn } from "@/lib/ui/cn";

export interface StepperProps {
  total: number;
  current: number;
  className?: string;
}

export function Stepper({ total, current, className }: StepperProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-300",
            i <= current
              ? "[background:linear-gradient(90deg,var(--accent-hi),var(--accent))]"
              : "bg-[var(--glass-fill)]"
          )}
          style={
            i === current
              ? { boxShadow: "0 0 16px rgba(var(--accent-glow), 0.6)" }
              : undefined
          }
        />
      ))}
    </div>
  );
}
