import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--hairline)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--ink)]"
            aria-label="TCG.ar - Inicio"
          >
            <Logo className="h-7" />
            <span className="text-[1.1rem] font-bold [font-family:var(--f-display)]">.ar</span>
          </Link>
          <p className="mt-3 t-sm t-mute">
            Mercado argentino de cartas Pokemon. Compras, ventas y trades con pagos
            integrados a Mercado Pago.
          </p>
        </div>

        <div>
          <p className="t-eyebrow">Mercado</p>
          <ul className="mt-3 space-y-2 t-sm">
            <li>
              <Link href="/market" className="t-mute hover:text-[var(--ink)]">
                Todas las publicaciones
              </Link>
            </li>
            <li>
              <Link href="/market?tab=cards" className="t-mute hover:text-[var(--ink)]">
                Cartas individuales
              </Link>
            </li>
            <li>
              <Link href="/trades" className="t-mute hover:text-[var(--ink)]">
                Trades
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="t-eyebrow">Vender</p>
          <ul className="mt-3 space-y-2 t-sm">
            <li>
              <Link href="/inventory" className="t-mute hover:text-[var(--ink)]">
                Cargar carta
              </Link>
            </li>
            <li>
              <Link href="/account" className="t-mute hover:text-[var(--ink)]">
                Conectar Mercado Pago
              </Link>
            </li>
            <li>
              <Link href="/listings" className="t-mute hover:text-[var(--ink)]">
                Mis publicaciones
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="t-eyebrow">Soporte</p>
          <ul className="mt-3 space-y-2 t-sm">
            <li>
              <Link href="/disputes" className="t-mute hover:text-[var(--ink)]">
                Disputas
              </Link>
            </li>
            <li>
              <Link href="/terms" className="t-mute hover:text-[var(--ink)]">
                Terminos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="t-mute hover:text-[var(--ink)]">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)] py-4">
        <p className="mx-auto max-w-7xl px-6 t-xs t-soft">
          © {new Date().getFullYear()} TCG.ar — Mercado de cartas Pokémon en Argentina.
        </p>
      </div>
    </footer>
  );
}
