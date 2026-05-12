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
            i <= current ? "bg-[var(--accent)]" : "bg-[var(--glass-fill)]"
          )}
        />
      ))}
    </div>
  );
}
