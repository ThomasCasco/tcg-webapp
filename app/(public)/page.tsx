import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { HeroCardStack } from "@/components/hero-card-stack";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { ArrowRight, Info, Package, ShieldCheck, ShoppingBag, Star } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {

  let featured: Awaited<ReturnType<typeof listListings>> = [];
  if (isSupabaseConfigured()) {
    try {
      const all = await listListings({ statuses: ["active"], onlyPublic: true });
      featured = all.filter((listing) => listing.listingType !== "mystery_pack").slice(0, 8);
    } catch {
      // Landing still renders without listings.
    }
  }

  // Only listings matched to the official catalog with a photo qualify for the
  // hero stack. Anything free-form (handwritten names, off-catalog uploads) is
  // excluded so user noise doesn't dominate the first impression.
  const heroStack = featured
    .filter((listing) => listing.catalogCardId && listing.imageUrl)
    .slice(0, 3);
  const showHeroStack = heroStack.length >= 3;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-[var(--hairline)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-12 pt-12 md:grid-cols-[0.95fr,1.05fr] md:items-center md:gap-12 md:pb-16 md:pt-16">
          <div className="max-w-2xl">
            <Chip size="sm">Pokémon TCG · Argentina</Chip>
            <h1 className="t-display mt-5 text-[2.5rem] leading-[1.05] text-[var(--ink)] md:text-[3.75rem]">
              Comprá y vendé cartas Pokémon en Argentina.
            </h1>
            <p className="mt-5 max-w-xl t-body-lg t-mute">
              Mercado entre coleccionistas: foto, condición y precio en pesos.
              Reservás, pagás con Mercado Pago o coordinás retiro.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/market">
                  <ShoppingBag className="h-5 w-5" />
                  Abrir mercado
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/how-it-works">
                  <Info className="h-4 w-4" />
                  Cómo funciona
                </Link>
              </Button>
            </div>

            <ul className="mt-10 grid gap-2 t-sm t-mute">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent-hi)]" />
                Pagás por Mercado Pago a la cuenta del vendedor: nada de transferencias.
              </li>
              <li className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 shrink-0 text-[var(--accent-hi)]" />
                Reputación armada solo con compras pagadas en la app.
              </li>
              <li className="inline-flex items-center gap-2">
                <Package className="h-4 w-4 shrink-0 text-[var(--accent-hi)]" />
                Seguimiento del envío y chat con el vendedor en cada compra.
              </li>
            </ul>
          </div>

          {showHeroStack ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="t-eyebrow">En venta ahora · {heroStack.length} destacadas</span>
                <Link
                  href="/market"
                  className="inline-flex items-center gap-1 t-sm font-semibold text-[var(--accent-hi)]"
                >
                  Ver todo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <HeroCardStack listings={heroStack} />
            </div>
          ) : (
            <div className="relative">
              <Image
                src="/img/hero/banner.png"
                alt="TCG.ar - cartas Pokémon: Charizard 1ra edición, Mew ex, Mega Charizard X"
                width={1200}
                height={675}
                priority
                className="h-auto w-full rounded-[var(--r-md)]"
              />
            </div>
          )}
        </div>
      </section>

      {/* Latest listings — excludes anything already shown in the hero stack so
          we don't repeat the same 3 cards immediately below. */}
      {(() => {
        const heroIds = new Set(heroStack.map((l) => l.id));
        const rest = showHeroStack
          ? featured.filter((l) => !heroIds.has(l.id))
          : featured;
        if (rest.length === 0) return null;
        return (
          <section className="mx-auto w-full max-w-7xl px-6 py-12">
            <div className="flex items-end justify-between gap-3">
              <h2 className="t-h1 [font-family:var(--f-display)]">Recién publicadas</h2>
              <Link
                href="/market"
                className="inline-flex items-center gap-1 t-sm font-bold text-[var(--accent-hi)] hover:underline"
              >
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {rest.map((listing) => (
                <MarketListingCard
                  key={listing.id}
                  listing={listing}
                  pokemonTypes={null}
                />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Empty-market CTA: only shown when there's literally nothing to browse. */}
      {featured.length === 0 && (
        <section className="border-t border-[var(--hairline)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-12">
            <Card padding="lg" className="text-center">
              <p className="t-body t-mute">
                Todavía no hay cartas publicadas en el mercado real.{" "}
                <Link href="/inventory" className="font-semibold text-[var(--accent-hi)] underline">
                  Subí la primera
                </Link>{" "}
                o leé{" "}
                <Link href="/how-it-works" className="font-semibold text-[var(--accent-hi)] underline">
                  cómo funciona la plataforma
                </Link>
                .
              </p>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
