import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { getSellerReputationSummaries, listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, X } from "@/components/ui/icon";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { MarketFiltersSheet } from "@/components/market-filters-sheet";
import type { CardCondition } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const CONDITIONS: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

function isCondition(value: string): value is CardCondition {
  return CONDITIONS.includes(value as CardCondition);
}

function getParamHref(
  next: Record<string, string | undefined>,
  current: Record<string, string>,
) {
  const params = new URLSearchParams();
  Object.entries(current).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  Object.entries(next).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });
  const query = params.toString();
  return query ? `/market?${query}` : "/market";
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    condition?: string;
    min?: string;
    max?: string;
    delivery?: string;
    sort?: string;
  }>;
}) {
  const user = await getAuthenticatedUser();
  const {
    tab = "all",
    q = "",
    condition = "",
    min = "",
    max = "",
    delivery = "",
    sort = "recent",
  } = await searchParams;
  let listings: Awaited<ReturnType<typeof listListings>> = [];
  let loadError: string | null = null;
  const activeTab = tab === "cards" ? "cards" : "all";
  const minPrice = Number(min);
  const maxPrice = Number(max);
  const hasMin = Number.isFinite(minPrice) && minPrice > 0;
  const hasMax = Number.isFinite(maxPrice) && maxPrice > 0;

  try {
    listings = await listListings({ onlyPublic: true });
    listings = listings.filter((listing) => listing.listingType !== "mystery_pack");
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load market listings.";
  }

  const query = q.trim().toLowerCase();
  if (query) {
    listings = listings.filter((listing) =>
      `${listing.cardName} ${listing.setName}`.toLowerCase().includes(query),
    );
  }

  if (condition && isCondition(condition)) {
    listings = listings.filter((listing) => listing.condition === condition);
  }

  if (hasMin) {
    listings = listings.filter((listing) => listing.priceArs >= minPrice);
  }

  if (hasMax) {
    listings = listings.filter((listing) => listing.priceArs <= maxPrice);
  }

  if (delivery === "shipping") {
    listings = listings.filter((listing) => listing.offersShipping);
  } else if (delivery === "pickup") {
    listings = listings.filter((listing) => listing.offersPickup);
  }

  if (activeTab === "cards") {
    listings = listings.filter((l) => l.listingType !== "mystery_pack");
  }

  if (sort === "price_asc") {
    listings = [...listings].sort((a, b) => a.priceArs - b.priceArs);
  } else if (sort === "price_desc") {
    listings = [...listings].sort((a, b) => b.priceArs - a.priceArs);
  } else {
    listings = [...listings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const sellerIds = [
    ...new Set(
      listings
        .map((l) => l.sellerId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const reputations: Record<string, { average: number; count: number }> =
    sellerIds.length
      ? await getSellerReputationSummaries(sellerIds).catch(() => ({}))
      : {};

  const enriched = await Promise.all(
    listings.map(async (listing, index) => {
      const pokemonTypes =
        index >= 24 ? null : await getPokemonTypesForCardTitle(listing.cardName);
      const sellerReputation =
        listing.sellerId && reputations[listing.sellerId]
          ? reputations[listing.sellerId]
          : undefined;
      return { listing, pokemonTypes, sellerReputation };
    }),
  );

  const total = enriched.length;
  const currentParams = {
    q,
    condition,
    min,
    max,
    delivery,
    sort,
    tab: activeTab,
  };

  const activeFilters: Array<{ label: string; removeHref: string }> = [];
  if (condition && isCondition(condition)) {
    activeFilters.push({
      label: formatConditionEs(condition),
      removeHref: getParamHref({ condition: undefined }, currentParams),
    });
  }
  if (delivery === "shipping" || delivery === "pickup") {
    activeFilters.push({
      label: delivery === "shipping" ? "Con envío" : "Con retiro",
      removeHref: getParamHref({ delivery: undefined }, currentParams),
    });
  }
  if (hasMin) {
    activeFilters.push({
      label: `Desde $${minPrice.toLocaleString("es-AR")}`,
      removeHref: getParamHref({ min: undefined }, currentParams),
    });
  }
  if (hasMax) {
    activeFilters.push({
      label: `Hasta $${maxPrice.toLocaleString("es-AR")}`,
      removeHref: getParamHref({ max: undefined }, currentParams),
    });
  }
  if (sort === "price_asc" || sort === "price_desc") {
    activeFilters.push({
      label: sort === "price_asc" ? "Menor precio" : "Mayor precio",
      removeHref: getParamHref({ sort: undefined }, currentParams),
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      {!isSupabaseConfigured() && (
        <Card padding="md" className="chip-warning">
          <p className="t-sm">Configurá Supabase en producción para abrir el marketplace.</p>
        </Card>
      )}

      {loadError && (
        <Card padding="md" className="chip-danger">
          <p className="t-sm">Error: {loadError}</p>
        </Card>
      )}

      <header className="flex flex-col gap-1">
        <p className="t-eyebrow">Marketplace</p>
        <h1 className="t-display text-[1.875rem] leading-tight text-[var(--ink)] md:text-[2.5rem]">
          Mercado de cartas
        </h1>
        <p className="t-sm t-mute">
          {total} {total === 1 ? "publicación" : "publicaciones"} · singles en pesos
        </p>
      </header>

      <section className="sticky top-14 z-10 -mx-3 bg-[var(--bg-0)]/95 px-3 py-3 backdrop-blur md:top-16 md:mx-0 md:rounded-[var(--r-md)] md:border md:border-[var(--hairline)] md:bg-[var(--bg-1)] md:p-3">
        <form method="GET" className="flex items-center gap-2">
          <input type="hidden" name="tab" value={activeTab} />
          {condition ? <input type="hidden" name="condition" value={condition} /> : null}
          {delivery ? <input type="hidden" name="delivery" value={delivery} /> : null}
          {min ? <input type="hidden" name="min" value={min} /> : null}
          {max ? <input type="hidden" name="max" value={max} /> : null}
          {sort && sort !== "recent" ? <input type="hidden" name="sort" value={sort} /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <input
              name="q"
              defaultValue={q}
              type="search"
              inputMode="search"
              placeholder="Buscar Charizard, Mew, Paradox Rift…"
              className="h-11 w-full rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] pl-10 pr-10 t-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)] focus:ring-2 focus:ring-[rgba(var(--accent-glow),0.3)]"
              aria-label="Buscar publicaciones"
            />
            {q ? (
              <Link
                href={getParamHref({ q: undefined }, currentParams)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--ink-soft)] hover:bg-white/10 hover:text-[var(--ink)]"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <MarketFiltersSheet
            initial={{ q, tab: activeTab, condition, delivery, min, max, sort: (sort === "price_asc" || sort === "price_desc" ? sort : "recent") }}
            activeCount={activeFilters.length}
          />
        </form>

        {(activeFilters.length > 0 || q) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {q ? (
              <Link
                href={getParamHref({ q: undefined }, currentParams)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2.5 py-1 t-xs font-semibold text-[var(--accent-hi)] hover:bg-[var(--accent)]/25"
              >
                <span>“{q}”</span>
                <X className="h-3 w-3" />
              </Link>
            ) : null}
            {activeFilters.map((f) => (
              <Link
                key={f.label}
                href={f.removeHref}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-2.5 py-1 t-xs font-semibold text-[var(--ink)] hover:border-[var(--accent-hi)]"
              >
                <span>{f.label}</span>
                <X className="h-3 w-3" />
              </Link>
            ))}
            {(activeFilters.length > 0 || q) && (
              <Link
                href="/market"
                className="ml-1 inline-flex items-center rounded-full px-2 py-1 t-xs font-semibold t-mute hover:text-[var(--ink)]"
              >
                Limpiar todo
              </Link>
            )}
          </div>
        )}
      </section>

      {total === 0 ? (
        <EmptyState
          image="/img/empty-states/market-empty.png"
          imageAlt="Caja de cartas vacía"
          title="Sin publicaciones"
          description={
            <>
              <p>Todavía no hay publicaciones que coincidan.</p>
              <p className="mt-1 t-xs">
                ¿Vendés cartas? Cargalas en{" "}
                <Link href="/inventory" className="font-semibold text-[var(--accent-hi)] underline">
                  Inventario
                </Link>{" "}
                y publicalas en un toque.
              </p>
            </>
          }
        />
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {enriched.map(({ listing, pokemonTypes, sellerReputation }) => (
            <MarketListingCard
              key={listing.id}
              listing={listing}
              pokemonTypes={pokemonTypes}
              isLoggedIn={Boolean(user)}
              sellerReputation={sellerReputation}
            />
          ))}
        </section>
      )}
    </main>
  );
}

