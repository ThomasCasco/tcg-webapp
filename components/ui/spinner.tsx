import { Loader2 } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin text-[var(--ink-mute)]", className)}
      aria-label="Cargando"
    />
  );
}

export function LoadingOverlay({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-[rgba(8,12,28,0.7)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[var(--ink-mute)]">
        <Spinner />
        <span className="text-[0.8125rem]">{label}</span>
      </div>
    </div>
  );
}
