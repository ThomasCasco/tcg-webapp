import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, SlidersHorizontal, Sparkles, ArrowUpDown } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import type { CardCondition } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "Todas" },
  { key: "cards", label: "Singles" },
] as const;

const CONDITIONS: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mas recientes" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
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
  const activeTab = TABS.some((item) => item.key === tab) ? tab : "all";
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

  const enriched = await Promise.all(
    listings.map(async (listing, index) => {
      const pokemonTypes =
        index >= 24 ? null : await getPokemonTypesForCardTitle(listing.cardName);
      return { listing, pokemonTypes };
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

  // Active filters count
  const activeFiltersCount = [
    condition,
    hasMin ? min : "",
    hasMax ? max : "",
    delivery,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <h1 className="text-3xl font-bold text-[var(--color-ink)] md:text-4xl [font-family:var(--font-display)]">
            Mercado de cartas
          </h1>
          <p className="mt-2 text-body text-[var(--color-ink-muted)] max-w-xl">
            Explora cartas publicadas por coleccionistas de todo el pais
          </p>
        </div>
      </div>

      {!isSupabaseConfigured() && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
          <Card padding="md" className="border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
            <p className="text-body-sm text-[var(--color-warning)]">
              Configura Supabase en produccion para abrir el marketplace.
            </p>
          </Card>
        </div>
      )}

      {loadError && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
          <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
            <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
          </Card>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        {/* Search & Filters */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 md:p-6">
          <form method="GET" className="space-y-4">
            <input type="hidden" name="tab" value={activeTab} />
            
            {/* Search Row */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por nombre o set..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="px-6 shrink-0">
                Buscar
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              <select
                name="condition"
                defaultValue={condition}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] min-w-[140px]"
              >
                <option value="">Condicion</option>
                {CONDITIONS.map((item) => (
                  <option key={item} value={item}>
                    {formatConditionEs(item)}
                  </option>
                ))}
              </select>

              <select
                name="delivery"
                defaultValue={delivery}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] min-w-[120px]"
              >
                <option value="">Entrega</option>
                <option value="shipping">Con envio</option>
                <option value="pickup">Retiro</option>
              </select>

              <div className="flex items-center gap-2">
                <Input 
                  name="min" 
                  defaultValue={min} 
                  type="number" 
                  min={1} 
                  placeholder="Min $" 
                  className="w-24 h-10"
                />
                <span className="text-[var(--color-ink-subtle)]">-</span>
                <Input 
                  name="max" 
                  defaultValue={max} 
                  type="number" 
                  min={1} 
                  placeholder="Max $" 
                  className="w-24 h-10"
                />
              </div>

              <select
                name="sort"
                defaultValue={sort}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] min-w-[140px]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  href={getParamHref({ tab: t.key }, currentParams)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeTab === t.key
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            <span className="font-semibold text-[var(--color-ink)]">{total}</span>
            {" "}
            {total === 1 ? "resultado" : "resultados"}
            {query && <span> para &quot;{q}&quot;</span>}
          </p>
          {activeFiltersCount > 0 && (
            <Link
              href="/market"
              className="text-sm font-medium text-[var(--color-ink)] hover:underline"
            >
              Limpiar filtros ({activeFiltersCount})
            </Link>
          )}
        </div>

        {/* Results Grid */}
        {total === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-[var(--color-ink-subtle)]" />
            <h3 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
              Sin resultados
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              No encontramos cartas con esos filtros.
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Queres{" "}
              <Link href="/inventory" className="font-semibold underline">
                publicar una carta
              </Link>
              ?
            </p>
          </div>
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
      </div>
    </main>
  );
}
