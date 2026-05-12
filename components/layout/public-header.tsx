import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[var(--bg-0)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="t-h2 text-[var(--accent-hi)] [font-family:var(--f-display)]"
        >
          TCG.ar
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/market"
            className="hidden text-[0.9375rem] font-medium text-[var(--ink-mute)] hover:text-[var(--ink)] sm:inline"
          >
            Mercado
          </Link>
          <Link
            href="/trades"
            className="hidden text-[0.9375rem] font-medium text-[var(--ink-mute)] hover:text-[var(--ink)] sm:inline"
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
