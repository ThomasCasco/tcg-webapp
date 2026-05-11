import Link from "next/link";
import { Sparkles } from "@/components/ui/icon";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-bold text-[var(--color-ink)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]">
                <Sparkles className="h-5 w-5 text-[var(--color-ink)]" />
              </span>
              <span className="[font-family:var(--font-display)] tracking-tight">TCG.ar</span>
            </Link>
            <p className="mt-4 text-body-sm text-[var(--color-ink-muted)] max-w-xs">
              El marketplace de Pokemon TCG para coleccionistas en Argentina. 
              Compra, vende y tradea con confianza.
            </p>
          </div>

          {/* Mercado */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Mercado</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/market" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Todas las cartas
                </Link>
              </li>
              <li>
                <Link 
                  href="/auctions" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Subastas
                </Link>
              </li>
              <li>
                <Link 
                  href="/trades" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Trades
                </Link>
              </li>
              <li>
                <Link 
                  href="/claims" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Claims
                </Link>
              </li>
            </ul>
          </div>

          {/* Vender */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Vender</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/inventory" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Cargar carta
                </Link>
              </li>
              <li>
                <Link 
                  href="/listings" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Mis publicaciones
                </Link>
              </li>
              <li>
                <Link 
                  href="/account" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Conectar Mercado Pago
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Soporte</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/how-it-works" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Como funciona
                </Link>
              </li>
              <li>
                <Link 
                  href="/disputes" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Disputas
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Terminos
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-body-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <p className="text-caption text-[var(--color-ink-subtle)]">
            {new Date().getFullYear()} TCG.ar - Pokemon TCG Argentina
          </p>
          <div className="flex items-center gap-4">
            <span className="text-caption text-[var(--color-ink-subtle)]">
              Hecho con carinio en Argentina
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
