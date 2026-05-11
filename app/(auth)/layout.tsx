import Link from "next/link";
import { Sparkles } from "@/components/ui/icon";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      {/* Header */}
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-[var(--color-ink)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]">
              <Sparkles className="h-5 w-5 text-[var(--color-ink)]" />
            </span>
            <span className="[font-family:var(--font-display)] tracking-tight">TCG.ar</span>
          </Link>
          <Link
            href="/market"
            className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Ver mercado
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6">
        <p className="text-center text-sm text-[var(--color-ink-subtle)]">
          TCG.ar - El marketplace de Pokemon TCG en Argentina
        </p>
      </footer>
    </div>
  );
}
