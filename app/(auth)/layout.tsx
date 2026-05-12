import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-[var(--hairline)] bg-[var(--bg-0)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 tracking-tight text-[var(--ink)]"
            aria-label="TCG.ar - Inicio"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="" className="h-9 w-auto" />
            <span className="text-[1.25rem] font-bold [font-family:var(--f-display)]">.ar</span>
          </Link>
          <Link
            href="/market"
            className="t-sm font-medium text-[var(--ink-mute)] hover:text-[var(--accent-hi)]"
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
