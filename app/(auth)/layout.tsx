import Link from "next/link";
import { ShoppingBag } from "@/components/ui/icon";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-[var(--hairline)] backdrop-blur-2xl [background:linear-gradient(180deg,rgba(11,19,43,0.85),rgba(11,19,43,0.55))]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[1.25rem] font-bold tracking-tight text-[var(--ink)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[var(--r-xs)] [background:linear-gradient(135deg,var(--accent-hi),#C77DFF)] text-white [box-shadow:0_0_24px_rgba(var(--accent-glow),0.55)]">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="[font-family:var(--f-display)]">TCG.ar</span>
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
