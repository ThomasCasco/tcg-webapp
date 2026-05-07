import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle,
  Search,
  ShoppingBag,
  Wallet,
} from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  let featured: Awaited<ReturnType<typeof listListings>> = [];
  if (isSupabaseConfigured()) {
    try {
      const all = await listListings({ statuses: ["active"], onlyPublic: true });
      featured = all.filter((listing) => listing.listingType !== "mystery_pack").slice(0, 8);
    } catch {
      // Landing still renders without listings.
    }
  }

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.1fr,0.9fr] md:gap-16 md:py-20">
          <div className="flex flex-col justify-center">
            <Chip variant="accent" size="sm" className="self-start">
              Pokemon TCG en Argentina
            </Chip>
            <h1 className="mt-4 text-display-md leading-[1.05] text-[var(--color-ink)] md:text-display-lg">
              Compra, vende e intercambia cartas{" "}
              <span className="text-[var(--color-accent-strong)]">Pokemon</span>.
            </h1>
            <p className="mt-5 max-w-xl text-body-lg text-[var(--color-ink-muted)]">
              Un mercado local para coleccionistas: publicaciones con precio en pesos,
              trades entre usuarios y pagos integrados con Mercado Pago cuando el vendedor
              lo tiene conectado.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/market">
                  <ShoppingBag className="h-5 w-5" />
                  Ver mercado
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/trades">
                  <ArrowLeftRight className="h-4 w-4" />
                  Ver trades
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href={user ? "/inventory" : "/register"}>
                  Cargar cartas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-caption text-[var(--color-ink-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                Pago con Mercado Pago
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                Precios en pesos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                Envio o retiro
              </span>
            </div>
          </div>

          <div className="grid content-center gap-3">
            <Card padding="lg" className="shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-card)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-overline text-[var(--color-ink-subtle)]">Busca</p>
                  <p className="text-h3">Charizard ex, Mew, Pikachu...</p>
                </div>
              </div>
            </Card>
            <Card padding="lg" className="shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-card)] bg-[var(--color-info-soft)] text-[var(--color-info)]">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-overline text-[var(--color-ink-subtle)]">Compra</p>
                  <p className="text-h3">Reserva, paga y coordina entrega.</p>
                </div>
              </div>
            </Card>
            <Card padding="lg" className="shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-card)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                  <ArrowLeftRight className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-overline text-[var(--color-ink-subtle)]">Intercambia</p>
                  <p className="text-h3">Publica tus cartas para trade.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Recien publicadas</p>
            <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Ultimas cartas en el mercado
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
              Todavia no hay cartas publicadas. Podes{" "}
              <Link href="/inventory" className="font-semibold underline">
                cargar una carta
              </Link>{" "}
              o explorar trades.
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

      <section className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="text-center">
            <p className="text-overline text-[var(--color-ink-subtle)]">Como funciona</p>
            <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Mercado y trades en un mismo lugar
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Pensado para comprar cartas, vender tu stock y encontrar intercambios.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <FeatureStep
              step="1"
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Explora el mercado"
              body="Filtra por carta, precio, condicion y entrega. Todo esta centrado en Pokemon TCG."
            />
            <FeatureStep
              step="2"
              icon={<Wallet className="h-6 w-6" />}
              title="Compra con Mercado Pago"
              body="Si el vendedor tiene MP conectado, el pago se inicia desde la publicacion y queda asociado a la operacion."
            />
            <FeatureStep
              step="3"
              icon={<ArrowLeftRight className="h-6 w-6" />}
              title="Arma trades"
              body="Marca cartas disponibles para intercambio y publica que cartas estas buscando."
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <Link href="/market">
                Entrar al mercado
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
