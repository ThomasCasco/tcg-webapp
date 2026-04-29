import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 md:py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)] text-lg font-bold text-white shadow-sm">
            T
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">TCG Market</p>
            <p className="text-[10px] uppercase tracking-[0.15em] subtle">Cartas Pokémon · AR</p>
          </div>
        </Link>
        <Link href="/market" className="btn btn-ghost btn-sm">
          Ver mercado
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center py-4">{children}</div>
    </div>
  );
}
