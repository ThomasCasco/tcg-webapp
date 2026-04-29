"use client";
import { Toaster as Sonner, toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)] text-[var(--color-ink)] shadow-[var(--shadow-card-lg)]",
          title: "font-semibold",
          description: "text-[var(--color-ink-muted)]",
        },
      }}
    />
  );
}

export { toast };
