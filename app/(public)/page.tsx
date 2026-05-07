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
  Package,
  Scale,
  ShoppingBag,
  Star,
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
      <section className="relative overflow-hidden bg-[#070707] text-white">
        <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-7xl gap-10 px-6 pb-10 pt-12 md:min-h-[calc(100svh-4rem)] md:grid-cols-[0.95fr,1.05fr] md:items-center md:gap-12 md:pb-14 md:pt-16">
          <div className="max-w-2xl">
            <Chip variant="default" size="sm" className="border-white/25 bg-white/10 text-white">
              Pokemon TCG Argentina
            </Chip>
            <h1 className="mt-5 text-display-md leading-[1.02] text-white md:text-[4.75rem] md:leading-[0.94]">
              Cartas reales. Mercado local. Liquidez simple.
            </h1>
            <p className="mt-5 max-w-xl text-body-lg text-white/72">
              Compra cartas publicadas por coleccionistas, vende tu stock en pesos y
              coordina trades desde una experiencia enfocada en TCG.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                <Link href="/market">
                  <ShoppingBag className="h-5 w-5" />
                  Abrir mercado
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="border-white bg-transparent text-white hover:bg-white hover:text-black"
              >
                <Link href="/trades">
                  <ArrowLeftRight className="h-4 w-4" />
                  Ver trades
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-white hover:bg-white/10">
                <Link href={user ? "/inventory" : "/register"}>
                  Publicar carta
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 border-y border-white/15 py-4 text-white">
              <MarketStat value={featured.length ? `${featured.length}` : "24/7"} label="listings" />
              <MarketStat value="ARS" label="precios locales" />
              <MarketStat value="MP" label="pagos integrados" />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-3 text-caption text-white/64">
              <span className="font-semibold uppercase">Live market</span>
              <Link href="/market" className="inline-flex items-center gap-1 font-semibold text-white">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {featured.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {["Charizard ex", "Pikachu promo", "Mew alt art", "Trainer gallery"].map((name, index) => (
                  <div key={name} className="min-h-72 border border-white/15 bg-white/[0.06] p-3">
                    <div className="grid aspect-[3/4] place-items-center bg-white/10 text-caption text-white/48">
                      Preview
                    </div>
                    <p className="mt-3 text-body-sm font-bold text-white">{name}</p>
                    <p className="text-caption text-white/56">Slot #{index + 1}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {featured.slice(0, 4).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/market/${listing.id}`}
                    className="group block overflow-hidden border border-white/15 bg-white/[0.06]"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-white/10">
                      {listing.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.imageUrl}
                          alt={listing.cardName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-caption text-white/48">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="border-t border-white/15 p-3">
                      <p className="text-body-sm font-extrabold text-white">
                        ARS {listing.priceArs.toLocaleString("es-AR")}
                      </p>
                      <p className="mt-1 line-clamp-1 text-caption text-white/68">
                        {listing.cardName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border-strong)] bg-white">
        <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-6 py-4">
          {["Pokemon", "Singles", "Trades", "Mercado Pago", "Retiro", "Envio"].map((label) => (
            <Link
              key={label}
              href={label === "Trades" ? "/trades" : "/market"}
              className="shrink-0 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] px-4 py-2 text-body-sm font-bold hover:bg-black hover:text-white"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Recien publicadas</p>
            <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Ultimas cartas en el mercado
            </h2>
          </div>
          <Link
            href="/market"
            className="inline-flex items-center gap-1 text-body-sm font-bold text-[var(--color-ink)] hover:underline"
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

      <section className="border-y border-[var(--color-border-strong)] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-0 px-6 py-12 md:grid-cols-3">
          <MarketSignal
            icon={<Package className="h-5 w-5" />}
            title="Publica stock"
            body="Carga fotos, condicion, precio y entrega para poner cartas en venta directa."
          />
          <MarketSignal
            icon={<Wallet className="h-5 w-5" />}
            title="Cobra local"
            body="Vende en pesos y usa Mercado Pago cuando el vendedor lo tenga conectado."
          />
          <MarketSignal
            icon={<Scale className="h-5 w-5" />}
            title="Mueve coleccion"
            body="Arma trades y encuentra coleccionistas con cartas compatibles."
          />
        </div>
      </section>

      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-overline text-[var(--color-ink-subtle)]">Como funciona</p>
            <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Del listing a la entrega, sin ruido.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <FeatureStep
              step="1"
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Explora cartas"
              body="Filtra por carta, precio, condicion y forma de entrega."
            />
            <FeatureStep
              step="2"
              icon={<Star className="h-6 w-6" />}
              title="Reserva o negocia"
              body="Abre la publicacion, revisa vendedor y coordina la operacion."
            />
            <FeatureStep
              step="3"
              icon={<ArrowLeftRight className="h-6 w-6" />}
              title="Compra, tradea o vende"
              body="Usa el marketplace para dar rotacion real a tu coleccion."
            />
          </div>

          <div className="mt-10 flex">
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

function MarketStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="pr-4">
      <p className="text-h2 font-extrabold text-white">{value}</p>
      <p className="mt-1 text-caption font-semibold uppercase text-white/52">{label}</p>
    </div>
  );
}

function MarketSignal({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="border-[var(--color-border-strong)] py-6 md:border-l md:px-6 md:first:border-l-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-black text-white">
        {icon}
      </div>
      <h3 className="mt-5 text-h3">{title}</h3>
      <p className="mt-2 max-w-sm text-body-sm text-[var(--color-ink-muted)]">{body}</p>
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
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-black text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-h3">{title}</h3>
      <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">{body}</p>
    </Card>
  );
}
