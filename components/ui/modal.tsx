"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

export interface ModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 backdrop-blur-md data-[state=open]:animate-[fade-in_200ms_var(--ease)_both]" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col glass rounded-t-[var(--r-lg)]",
            "md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--r-lg)]",
            "data-[state=open]:animate-[slide-up_300ms_var(--ease)_both]",
            "shadow-[0_32px_64px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]",
            sizeClass[size],
            "md:w-full",
          )}
        >
          {/* Accent top border */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-[var(--r-lg)] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />

          <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--hairline)]">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Dialog.Title className="t-h2 leading-tight">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="t-sm t-mute mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="mt-0.5 shrink-0 grid h-8 w-8 place-items-center rounded-full border border-transparent text-[var(--ink-mute)] transition-colors hover:border-[var(--glass-border)] hover:bg-white/10 hover:text-[var(--ink)]"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

          {footer && (
            <footer className="shrink-0 border-t border-[var(--hairline)] bg-[var(--glass-fill)] px-5 py-3">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
