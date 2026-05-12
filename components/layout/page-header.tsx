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
    <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3 backdrop-blur-2xl [background:linear-gradient(180deg,rgba(11,19,43,0.9),rgba(11,19,43,0.6))] md:static md:mx-0 md:border-b-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Volver"
          className="btn-icon md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="t-h2 truncate md:t-h1">{title}</h1>
        {subtitle && <p className="t-sm t-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
