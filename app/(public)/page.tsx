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
  Gavel,
  Info,
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(1200px_600px_at_80%_-10%,rgba(var(--accent-glow),0.28),transparent_60%),radial-gradient(900px_500px_at_-10%_30%,rgba(199,125,255,0.18),transparent_60%)]"
        />
        <div className="relative mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-7xl gap-10 px-6 pb-10 pt-12 md:min-h-[calc(100svh-4rem)] md:grid-cols-[0.95fr,1.05fr] md:items-center md:gap-12 md:pb-14 md:pt-16">
          <div className="max-w-2xl screen-in">
            <Chip variant="accent" size="sm">
              Pokémon TCG · Argentina
            </Chip>
            <h1 className="t-display mt-5 text-[2.75rem] leading-[1.02] text-[var(--ink)] md:text-[4.5rem]">
              Cartas reales. <br />
              Mercado local. <br />
              <span className="bg-gradient-to-r from-[var(--accent-hi)] via-[#C77DFF] to-[var(--accent)] bg-clip-text text-transparent">
                Liquidez simple.
              </span>
            </h1>
            <p className="mt-5 max-w-xl t-body-lg t-mute">
              Comprá cartas publicadas por coleccionistas, vendé tu stock en pesos y
              coordiná trades desde una experiencia enfocada en TCG.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/market">
                  <ShoppingBag className="h-5 w-5" />
                  Abrir mercado
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/auctions">
                  <Gavel className="h-4 w-4" />
                  Subastas
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/trades">
                  <ArrowLeftRight className="h-4 w-4" />
                  Trades
                </Link>
              </Button>
              <Button asChild variant="link" size="lg">
                <Link href="/how-it-works">
                  <Info className="h-4 w-4" />
                  Cómo funciona
                </Link>
              </Button>
            </div>

            <Card variant="muted" className="mt-10 grid grid-cols-3 gap-0 p-0">
              <MarketStat value={featured.length ? `${featured.length}` : "24/7"} label="listings" />
              <MarketStat value="ARS" label="precios locales" divider />
              <MarketStat value="MP" label="pagos integrados" divider />
            </Card>
          </div>

          <div className="screen-in">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <span className="t-eyebrow">Live market</span>
              <Link
                href="/market"
                className="inline-flex items-center gap-1 t-sm font-semibold text-[var(--accent-hi)]"
              >
                Ver todo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {featured.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {["Charizard ex", "Pikachu promo", "Mew alt art", "Trainer gallery"].map((name, index) => (
                  <Card key={name} variant="muted" padding="sm">
                    <div className="grid aspect-[3/4] place-items-center rounded-[var(--r-sm)] bg-white/5 t-xs t-soft">
                      Preview
                    </div>
                    <p className="mt-3 t-sm font-bold text-[var(--ink)]">{name}</p>
                    <p className="t-xs t-mute">Slot #{index + 1}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {featured.slice(0, 4).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/market/${listing.id}`}
                    className="group block overflow-hidden glass-soft transition-transform hover:-translate-y-0.5"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-white/5">
                      {listing.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.imageUrl}
                          alt={listing.cardName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center t-xs t-soft">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="border-t border-[var(--hairline)] p-3">
                      <p className="t-sm font-extrabold t-mono text-[var(--ink)]">
                        ARS {listing.priceArs.toLocaleString("es-AR")}
                      </p>
                      <p className="mt-1 line-clamp-1 t-xs t-mute">{listing.cardName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick category chips */}
      <section className="border-y border-[var(--hairline)]">
        <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-6 py-4 scroll-x">
          {["Pokémon", "Singles", "Trades", "Mercado Pago", "Retiro", "Envío"].map((label) => (
            <Link
              key={label}
              href={label === "Trades" ? "/trades" : "/market"}
              className="chip shrink-0 hover:chip-active"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest cards */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="t-eyebrow">Recién publicadas</p>
            <h2 className="mt-1 t-h1 [font-family:var(--f-display)]">
              Últimas cartas en el mercado
            </h2>
          </div>
          <Link
            href="/market"
            className="inline-flex items-center gap-1 t-sm font-bold text-[var(--accent-hi)] hover:underline"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <Card padding="lg" className="mt-6 text-center">
            <p className="t-sm t-mute">
              Todavía no hay cartas publicadas. Podés{" "}
              <Link href="/inventory" className="font-semibold text-[var(--accent-hi)] underline">
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

      {/* Signals strip */}
      <section className="border-y border-[var(--hairline)]">
        <div className="mx-auto grid w-full max-w-7xl gap-0 px-6 py-12 md:grid-cols-3">
          <MarketSignal
            icon={<Package className="h-5 w-5" />}
            title="Publicá stock"
            body="Cargá fotos, condición, precio y entrega para poner cartas en venta directa."
          />
          <MarketSignal
            icon={<Wallet className="h-5 w-5" />}
            title="Cobrá local"
            body="Vendé en pesos y usá Mercado Pago cuando el vendedor lo tenga conectado."
            divider
          />
          <MarketSignal
            icon={<Scale className="h-5 w-5" />}
            title="Movés colección"
            body="Armá trades y encontrá coleccionistas con cartas compatibles."
            divider
          />
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="t-eyebrow">Cómo funciona</p>
            <h2 className="mt-1 t-h1 [font-family:var(--f-display)]">
              Del listing a la entrega, sin ruido.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <FeatureStep
              step="1"
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Explorá cartas"
              body="Filtrá por carta, precio, condición y forma de entrega."
            />
            <FeatureStep
              step="2"
              icon={<Star className="h-6 w-6" />}
              title="Reservá o negociá"
              body="Abrí la publicación, revisá vendedor y coordiná la operación."
            />
            <FeatureStep
              step="3"
              icon={<ArrowLeftRight className="h-6 w-6" />}
              title="Comprá, tradeá o vendé"
              body="Usá el marketplace para dar rotación real a tu colección."
            />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/market">
                Entrar al mercado
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/how-it-works">
                <Info className="h-4 w-4" />
                Leer la guía completa
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MarketStat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <div className={`px-4 py-4 ${divider ? "border-l border-[var(--hairline)]" : ""}`}>
      <p className="t-h2 t-mono font-extrabold text-[var(--ink)]">{value}</p>
      <p className="mt-1 t-eyebrow">{label}</p>
    </div>
  );
}

function MarketSignal({
  icon,
  title,
  body,
  divider,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  divider?: boolean;
}) {
  return (
    <div className={`py-6 md:px-6 ${divider ? "md:border-l md:border-[var(--hairline)]" : ""}`}>
      <div className="grid h-10 w-10 place-items-center rounded-[var(--r-xs)] [background:linear-gradient(135deg,var(--accent-hi),#C77DFF)] text-white [box-shadow:0_0_24px_rgba(var(--accent-glow),0.35)]">
        {icon}
      </div>
      <h3 className="mt-5 t-h3">{title}</h3>
      <p className="mt-2 max-w-sm t-sm t-mute">{body}</p>
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
      <span className="absolute -top-3 left-5 grid h-7 w-7 place-items-center rounded-full [background:linear-gradient(180deg,var(--accent-hi),var(--accent))] text-[0.75rem] font-bold text-white [box-shadow:0_6px_18px_rgba(var(--accent-glow),0.45)]">
        {step}
      </span>
      <div className="grid h-10 w-10 place-items-center rounded-[var(--r-xs)] [background:linear-gradient(135deg,var(--accent-hi),#C77DFF)] text-white">
        {icon}
      </div>
      <h3 className="mt-4 t-h3">{title}</h3>
      <p className="mt-2 t-sm t-mute">{body}</p>
    </Card>
  );
}
