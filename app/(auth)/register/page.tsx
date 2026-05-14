import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { Check, ShoppingBag } from "@/components/ui/icon";

const BENEFITS = [
  "Cargá tu inventario en minutos",
  "Vendé en pesos con Mercado Pago",
  "Coordiná trades con la comunidad",
];

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="grid min-h-svh place-items-center bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-elevated)] to-[var(--color-accent-soft)]/40 p-4">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
        <aside className="hidden flex-col justify-between rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-ink)] p-8 text-[var(--color-ink-inverse)] lg:flex">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-body-sm font-bold text-white"
            >
              <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-input)] bg-white text-[var(--color-ink)]">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="[font-family:var(--font-display)] text-h3">TCG.ar</span>
            </Link>
            <p className="mt-8 text-overline text-white/60">Sumate al mercado</p>
            <h2 className="mt-2 text-h1 leading-tight [font-family:var(--font-display)] text-white">
              Cartas reales, mercado local, liquidez simple.
            </h2>
            <p className="mt-3 max-w-sm text-body-sm text-white/72">
              Pokémon TCG en pesos, con vendedores verificables y trades entre
              coleccionistas.
            </p>
          </div>
          <ul className="mt-10 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-body-sm text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </aside>

        <Card
          as="section"
          padding="lg"
          className="w-full border-[var(--color-border-strong)] shadow-[var(--shadow-card-lg)]"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-sm font-bold text-[var(--color-ink)] lg:hidden"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-input)] bg-[var(--color-ink)] text-[var(--color-ink-inverse)]">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="[font-family:var(--font-display)] text-h3">TCG.ar</span>
          </Link>

          <p className="mt-6 text-overline text-[var(--color-ink-subtle)] lg:mt-0">
            Onboarding vendedor
          </p>
          <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
            Crear cuenta
          </h1>
          <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
            Registrate para cargar tu inventario y publicar cartas.
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
