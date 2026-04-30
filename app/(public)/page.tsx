import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  Wallet,
  ShoppingBag,
  ImagePlus,
  CheckCircle,
  ArrowRight,
} from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  let featured: Awaited<ReturnType<typeof listListings>> = [];
  if (isSupabaseConfigured()) {
    try {
      const all = await listListings({ statuses: ["active"], onlyPublic: true });
      featured = all.slice(0, 8);
    } catch {
      // fail silently — landing still renders
    }
  }

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-accent-soft)] via-[var(--color-surface)] to-[var(--color-surface-elevated)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.1fr,0.9fr] md:gap-16 md:py-20">
          <div className="flex flex-col justify-center">
            <Chip variant="accent" size="sm" className="self-start">
              Argentina · Pokemon TCG
            </Chip>
            <h1 className="mt-4 text-display-md leading-[1.05] text-[var(--color-ink)] md:text-display-lg">
              Comprá y vendé cartas{" "}
              <span className="text-[var(--color-accent-strong)]">sin vueltas</span>.
            </h1>
            <p className="mt-5 max-w-xl text-body-lg text-[var(--color-ink-muted)]">
              Marketplace argentino de Pokémon TCG con pago automático por Mercado Pago,
              comisión del 1 % y envío en todo el país.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/market">
                  <ShoppingBag className="h-5 w-5" />
                  Explorar mercado
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={user ? "/inventory" : "/register"}>
                  Empezar a vender
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-caption text-[var(--color-ink-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                Pago seguro Mercado Pago
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                Comisión 1 %
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                Envío + retiro
              </span>
            </div>
          </div>

          {/* Decorative card stack */}
          <div className="relative hidden md:block">
            <div className="absolute -right-4 top-8 aspect-[3/4] w-40 rotate-6 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 shadow-2xl" />
            <div className="absolute right-32 top-0 aspect-[3/4] w-44 -rotate-6 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-2xl" />
            <div className="relative aspect-[3/4] w-48 mx-auto rotate-2 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Recién publicadas</p>
            <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Las últimas en el mercado
            </h2>
          </div>
          <Link
            href="/market"
            className="hidden text-body-sm font-semibold text-[var(--color-accent-strong)] hover:underline md:inline-flex md:items-center md:gap-1"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <Card padding="lg" className="mt-6 text-center">
            <p className="text-body-sm text-[var(--color-ink-muted)]">
              Todavía no hay publicaciones. Sé el primero en{" "}
              <Link href="/inventory" className="font-semibold underline">
                cargar una carta
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {featured.map((listing) => (
              <MarketListingCard
                key={listing.id}
                listing={listing}
                pokemonTypes={null}
                isLoggedIn={Boolean(user)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── How it works (sellers) ── */}
      <section className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="text-center">
            <p className="text-overline text-[var(--color-ink-subtle)]">Para vendedores</p>
            <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Vendé en tres pasos
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Sin vendor friction. Foto, precio, publicar.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <FeatureStep
              step="1"
              icon={<ImagePlus className="h-6 w-6" />}
              title="Cargá tu carta"
              body="Buscala en nuestro catálogo o subí tu propia foto. Indicá la condición y el precio."
            />
            <FeatureStep
              step="2"
              icon={<Wallet className="h-6 w-6" />}
              title="Conectá Mercado Pago"
              body="Una sola vez. Recibís los pagos directo en tu cuenta de MP cuando vendés."
            />
            <FeatureStep
              step="3"
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Publicá y vendé"
              body="El comprador paga al instante. Vos coordinás envío o retiro. Comisión 1 %."
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <Link href={user ? "/inventory" : "/register"}>
                {user ? "Ir al inventario" : "Crear cuenta gratis"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureStep({
  step,
  icon,
  title,
  body,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card padding="lg" className="relative">
      <span className="absolute -top-3 left-5 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-accent)] text-[0.75rem] font-bold text-white">
        {step}
      </span>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
        {icon}
      </div>
      <h3 className="mt-4 text-h3">{title}</h3>
      <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">{body}</p>
    </Card>
  );
}
