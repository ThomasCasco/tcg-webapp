import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag, Search } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "Todo" },
  { key: "cards", label: "Cartas" },
  { key: "packs", label: "Packs" },
] as const;

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { tab = "all", q = "" } = await searchParams;
  let listings: Awaited<ReturnType<typeof listListings>> = [];
  let loadError: string | null = null;

  try {
    listings = await listListings({ onlyPublic: true });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load market listings.";
  }

  const query = q.trim().toLowerCase();
  if (query) {
    listings = listings.filter((listing) =>
      `${listing.cardName} ${listing.setName} ${listing.packTheme ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }

  if (tab === "packs") {
    listings = listings.filter((l) => l.listingType === "mystery_pack");
  } else if (tab === "cards") {
    listings = listings.filter((l) => l.listingType !== "mystery_pack");
  }

  const enriched = await Promise.all(
    listings.map(async (listing, index) => {
      const pokemonTypes =
        listing.listingType === "mystery_pack" || index >= 24
          ? null
          : await getPokemonTypesForCardTitle(listing.cardName);
      return { listing, pokemonTypes };
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      {!isSupabaseConfigured() && (
        <Card padding="md" className="border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
          <p className="text-body-sm text-[var(--color-warning)]">
            Configurá Supabase en producción para abrir el marketplace.
          </p>
        </Card>
      )}

      {loadError && (
        <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      )}

      {/* ── Search header — sticky on mobile for thumb access ── */}
      <header className="sticky top-0 z-10 -mx-3 bg-[var(--color-surface)]/95 px-3 py-3 backdrop-blur md:relative md:mx-0 md:rounded-[var(--radius-card)] md:bg-[var(--color-surface-elevated)] md:p-5 md:shadow-sm">
        <h1 className="hidden text-h2 [font-family:var(--font-display)] md:block">
          Mercado
        </h1>
        <p className="mt-1 hidden text-body-sm text-[var(--color-ink-muted)] md:block">
          Cartas y packs publicados por la comunidad. Pago seguro vía Mercado Pago.
        </p>

        <form method="GET" className="mt-0 flex gap-2 md:mt-4">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar Charizard, Mew, Paradox Rift..."
              className="pl-9"
            />
          </div>
          <Button type="submit" size="md">
            Buscar
          </Button>
        </form>

        <div className="mt-3 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/market?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-colors",
                tab === t.key
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent-strong)]",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      {/* ── Results count ── */}
      <p className="text-caption text-[var(--color-ink-muted)]">
        {enriched.length} {enriched.length === 1 ? "publicación" : "publicaciones"}
        {query && ` para "${q}"`}
      </p>

      {/* ── Grid ── */}
      {enriched.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Sin publicaciones"
          description={
            <>
              <p>Todavía no hay publicaciones que coincidan.</p>
              <p className="mt-1 text-caption">
                ¿Vendés cartas? Cargalas en{" "}
                <Link href="/inventory" className="font-semibold underline">
                  Inventario
                </Link>{" "}
                y publicalas en un toque.
              </p>
            </>
          }
        />
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {enriched.map(({ listing, pokemonTypes }) => (
            <MarketListingCard
              key={listing.id}
              listing={listing}
              pokemonTypes={pokemonTypes}
              isLoggedIn={Boolean(user)}
            />
          ))}
        </section>
      )}
    </main>
  );
}
