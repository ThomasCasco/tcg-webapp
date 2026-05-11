"use client";
/**
 * TopBar — sticky navigation bar shown across the entire site.
 *
 * Layout:
 *   [Logo] [Search bar (flex)] [Actions: bell, user menu | login/register]
 *
 * Responsive:
 *   - Mobile: logo + search icon button + bell + avatar
 *   - Tablet+: logo + full search bar + bell + user menu
 */

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

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-3 md:h-16 md:gap-5 md:px-6">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[1.25rem] font-bold leading-none text-[var(--color-ink)] md:text-[1.5rem]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-input)] border border-[var(--color-ink)] bg-[var(--color-ink)] text-white">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline [font-family:var(--font-display)]">
            TCG.ar
          </span>
        </Link>

        {/* ── Search ── */}
        {!hideSearch && (
          <form
            onSubmit={onSearch}
            className="hidden flex-1 items-center md:flex"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
              <input
                type="search"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar Charizard, Mew, Paradox Rift..."
                className={cn(
                  "h-10 w-full rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface)] pl-9 pr-3 text-body-sm",
                  "outline-none placeholder:text-[var(--color-ink-subtle)]",
                  "focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20",
                )}
                aria-label="Buscar publicaciones"
              />
            </div>
          </form>
        )}

        {/* When search is hidden, push nav + actions to the right */}
        {hideSearch && <div className="hidden flex-1 md:block" />}

        {/* ── Actions ── */}
        {showNav && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegacion publica">
            <Link
              href="/market"
              className={cn(
                "rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium",
                pathname === "/market"
                  ? "bg-[var(--color-ink)] text-[var(--color-ink-inverse)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]",
              )}
            >
              Mercado
            </Link>
            <Link
              href="/auctions"
              className={cn(
                "rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium",
                pathname === "/auctions"
                  ? "bg-[var(--color-ink)] text-[var(--color-ink-inverse)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]",
              )}
            >
              Subastas
            </Link>
            <Link
              href="/claims"
              className={cn(
                "rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium",
                pathname === "/claims"
                  ? "bg-[var(--color-ink)] text-[var(--color-ink-inverse)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]",
              )}
            >
              Claims
            </Link>
            <Link
              href="/trades"
              className={cn(
                "rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium",
                pathname === "/trades"
                  ? "bg-[var(--color-ink)] text-[var(--color-ink-inverse)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]",
              )}
            >
              Trades
            </Link>
            <Link
              href="/how-it-works"
              className={cn(
                "rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium",
                pathname === "/how-it-works"
                  ? "bg-[var(--color-ink)] text-[var(--color-ink-inverse)]"
                  : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]",
              )}
            >
              Cómo funciona
            </Link>
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
                className="hidden rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)] sm:inline-block"
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
