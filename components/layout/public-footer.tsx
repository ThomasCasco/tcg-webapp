import Link from "next/link";
import { ShoppingBag } from "@/components/ui/icon";

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-[1.25rem] font-bold text-[var(--color-ink)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-input)] bg-[var(--color-ink)] text-white">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="[font-family:var(--font-display)]">TCG.ar</span>
          </Link>
          <p className="mt-3 text-body-sm text-[var(--color-ink-muted)]">
            Mercado argentino de cartas Pokemon. Compras, ventas y trades con pagos
            integrados a Mercado Pago.
          </p>
        </div>

        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">Mercado</p>
          <ul className="mt-3 space-y-2 text-body-sm">
            <li>
              <Link href="/market" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Todas las publicaciones
              </Link>
            </li>
            <li>
              <Link
                href="/market?tab=cards"
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                Cartas individuales
              </Link>
            </li>
            <li>
              <Link href="/trades" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Trades
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">Vender</p>
          <ul className="mt-3 space-y-2 text-body-sm">
            <li>
              <Link href="/inventory" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Cargar carta
              </Link>
            </li>
            <li>
              <Link href="/account" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Conectar Mercado Pago
              </Link>
            </li>
            <li>
              <Link href="/listings" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Mis publicaciones
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">Soporte</p>
          <ul className="mt-3 space-y-2 text-body-sm">
            <li>
              <Link href="/disputes" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Disputas
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Terminos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--color-border-subtle)] py-4">
        <p className="mx-auto max-w-7xl px-6 text-caption text-[var(--color-ink-subtle)]">
          (c) {new Date().getFullYear()} TCG.ar - Mercado de cartas Pokemon en Argentina.
        </p>
      </div>
    </footer>
  );
}
