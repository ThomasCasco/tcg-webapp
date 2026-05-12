"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search, ShoppingBag } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/ui/cn";

type Props = {
  user: { username: string; email?: string } | null;
};

export function TopBar({ user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/market?q=${encodeURIComponent(q)}`);
    else router.push("/market");
  }

  const hideSearch =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname === "/market";

  const showNav =
    !pathname?.startsWith("/login") && !pathname?.startsWith("/register");

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      key={href}
      className={cn(
        "rounded-full px-3 py-1.5 t-sm font-semibold transition-colors",
        pathname === href
          ? "[background:linear-gradient(180deg,var(--accent-hi),var(--accent))] text-white [box-shadow:0_6px_18px_rgba(var(--accent-glow),0.45)]"
          : "text-[var(--ink-mute)] hover:bg-white/5 hover:text-[var(--ink)]"
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] backdrop-blur-2xl [background:linear-gradient(180deg,rgba(11,19,43,0.85),rgba(11,19,43,0.55))]">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-3 md:h-16 md:gap-5 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[1.25rem] font-bold leading-none text-[var(--ink)] md:text-[1.5rem]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[var(--r-xs)] [background:linear-gradient(135deg,var(--accent-hi),#C77DFF)] text-white [box-shadow:0_0_24px_rgba(var(--accent-glow),0.55)]">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline [font-family:var(--f-display)]">
            TCG.ar
          </span>
        </Link>

        {!hideSearch && (
          <form
            onSubmit={onSearch}
            className="hidden flex-1 items-center md:flex"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input
                type="search"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar Charizard, Mew, Paradox Rift..."
                className={cn(
                  "h-10 w-full rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-md pl-10 pr-4 t-sm text-[var(--ink)]",
                  "outline-none placeholder:text-[var(--ink-soft)]",
                  "focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)] focus:ring-2 focus:ring-[rgba(var(--accent-glow),0.3)]"
                )}
                aria-label="Buscar publicaciones"
              />
            </div>
          </form>
        )}

        {hideSearch && <div className="hidden flex-1 md:block" />}

        {showNav && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegacion publica">
            {navLink("/market", "Mercado")}
            {navLink("/auctions", "Subastas")}
            {navLink("/claims", "Claims")}
            {navLink("/trades", "Trades")}
            {navLink("/how-it-works", "Cómo funciona")}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          {user ? (
            <>
              <NotificationsBell />
              <UserMenu username={user.username} email={user.email} onLogout={logout} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-2 t-sm font-semibold text-[var(--ink-mute)] hover:bg-white/5 hover:text-[var(--ink)] sm:inline-block"
              >
                Ingresar
              </Link>
              <Button asChild size="sm">
                <Link href="/register">Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
