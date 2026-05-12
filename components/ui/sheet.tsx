"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

export interface SheetProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sideClass = {
  right: "right-0 top-0 h-full w-full max-w-sm rounded-l-[var(--r-lg)]",
  left: "left-0 top-0 h-full w-full max-w-sm rounded-r-[var(--r-lg)]",
  bottom: "inset-x-0 bottom-0 max-h-[90vh] rounded-t-[var(--r-lg)]",
};

export function Sheet({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  side = "bottom",
  children,
  footer,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_220ms_var(--ease)_both]" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col glass",
            "data-[state=open]:animate-[slide-up_320ms_var(--ease)_both]",
            sideClass[side]
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="t-h2">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="t-sm t-mute">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-full p-1.5 text-[var(--ink-mute)] hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="border-t border-[var(--hairline)] px-5 py-3">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
