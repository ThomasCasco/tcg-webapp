import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-[0.8125rem] text-[var(--color-ink-muted)] md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} TCG Market AR — Beta</p>
        <nav className="flex gap-4">
          <Link href="/terms" className="hover:underline">
            Términos
          </Link>
          <Link href="/market" className="hover:underline">
            Mercado
          </Link>
        </nav>
      </div>
    </footer>
  );
}
