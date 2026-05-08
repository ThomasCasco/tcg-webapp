import Link from "next/link";
import { ShoppingBag } from "@/components/ui/icon";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="premium-page flex min-h-svh flex-col">
      <header className="border-b border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[1.25rem] font-bold tracking-tight text-[var(--color-ink)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-input)] border border-[var(--color-ink)] bg-[var(--color-ink)] text-white">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="[font-family:var(--font-display)]">TCG.ar</span>
          </Link>
          <Link
            href="/market"
            className="text-body-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-accent-strong)]"
          >
            Ver mercado
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
