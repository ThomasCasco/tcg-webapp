import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-h3 font-bold text-[var(--color-accent-strong)]">
          TCG.ar
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/market"
            className="hidden text-[0.9375rem] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline"
          >
            Mercado
          </Link>
          <Link
            href="/trades"
            className="hidden text-[0.9375rem] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline"
          >
            Trades
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
