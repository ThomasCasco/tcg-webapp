"use client";
import Link from "next/link";
import { ArrowLeft } from "@/components/ui/icon";

export interface PageHeaderProps {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
  subtitle?: string;
}

export function PageHeader({ title, backHref, actions, subtitle }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-b-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Volver"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-h3 md:text-h1">{title}</h1>
        {subtitle && (
          <p className="text-[0.8125rem] text-[var(--color-ink-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
