"use client";
/**
 * TopBar — sticky navigation bar shown across the entire site.
 *
 * Clean, minimal design with clear navigation hierarchy.
 */

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search, Menu, X, Sparkles } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/ui/cn";

type Props = {
  user: { username: string; email?: string } | null;
};

const NAV_LINKS = [
  { href: "/market", label: "Mercado" },
  { href: "/auctions", label: "Subastas" },
  { href: "/trades", label: "Trades" },
  { href: "/claims", label: "Claims" },
];

export function TopBar({ user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const isMarketPage = pathname === "/market";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-xl font-bold text-[var(--color-ink)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]">
              <Sparkles className="h-5 w-5 text-[var(--color-ink)]" />
            </span>
            <span className="hidden sm:inline [font-family:var(--font-display)] tracking-tight">
              TCG.ar
            </span>
          </Link>

          {/* Desktop Search */}
          {!isAuthPage && !isMarketPage && (
            <form
              onSubmit={onSearch}
              className="hidden flex-1 max-w-md md:flex"
              role="search"
            >
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                <input
                  type="search"
                  inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cartas..."
                  className={cn(
                    "h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] pl-10 pr-4 text-sm",
                    "outline-none placeholder:text-[var(--color-ink-subtle)]",
                    "focus:border-[var(--color-ink)] focus:bg-white focus:ring-2 focus:ring-[var(--color-ink)]/10",
                    "transition-colors"
                  )}
                  aria-label="Buscar publicaciones"
                />
              </div>
            </form>
          )}

          {/* Spacer */}
          <div className="flex-1 md:hidden" />
          {(isAuthPage || isMarketPage) && <div className="hidden flex-1 md:block" />}

          {/* Desktop Navigation */}
          {!isAuthPage && (
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegacion principal">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    pathname === link.href
                      ? "bg-[var(--color-ink)] text-white"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NotificationsBell />
                <UserMenu username={user.username} email={user.email} onLogout={logout} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline-block"
                >
                  Ingresar
                </Link>
                <Button asChild size="sm" className="px-4">
                  <Link href="/register">Crear cuenta</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            {!isAuthPage && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] lg:hidden"
                aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && !isAuthPage && (
        <div className="fixed inset-0 top-16 z-40 bg-white lg:hidden">
          <nav className="flex flex-col p-4 border-b border-[var(--color-border)]">
            {/* Mobile Search */}
            <form onSubmit={onSearch} className="mb-4" role="search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                <input
                  type="search"
                  inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cartas..."
                  className="h-12 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] pl-10 pr-4 text-base"
                />
              </div>
            </form>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors",
                  pathname === link.href
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                Como funciona
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
