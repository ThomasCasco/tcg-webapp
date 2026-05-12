"use client";
import { Toaster as Sonner, toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "glass !bg-[linear-gradient(180deg,rgba(20,28,52,0.92),rgba(8,12,28,0.96))] !text-[var(--ink)] !border-[var(--glass-border)]",
          title: "!font-semibold !text-[var(--ink)]",
          description: "!text-[var(--ink-mute)]",
          actionButton: "!bg-[var(--accent)] !text-white",
          success: "!text-[#3FE6A0]",
          error: "!text-[#FF8090]",
        },
      }}
    />
  );
}

export { toast };
