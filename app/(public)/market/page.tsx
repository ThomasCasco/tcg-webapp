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
import { formatConditionEs } from "@/lib/shared/condition-labels";
import type { CardCondition } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "Todo" },
  { key: "cards", label: "Cartas" },
] as const;

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
      `${listing.cardName} ${listing.setName}`
        .toLowerCase()
        .includes(query),
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
        index >= 24
          ? null
          : await getPokemonTypesForCardTitle(listing.cardName);
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      {!isSupabaseConfigured() && (
        <Card padding="md" className="border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
          <p className="text-body-sm text-[var(--color-warning)]">
            Configura Supabase en produccion para abrir el marketplace.
          </p>
        </Card>
      )}

      {loadError && (
        <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      )}

      <header className="sticky top-14 z-10 -mx-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 px-3 py-3 backdrop-blur md:relative md:top-auto md:mx-0 md:rounded-[var(--radius-card)] md:border md:bg-[var(--color-surface-elevated)] md:p-5 md:shadow-sm">
        <h1 className="hidden text-h2 [font-family:var(--font-display)] md:block">
          Mercado
        </h1>
        <p className="mt-1 hidden text-body-sm text-[var(--color-ink-muted)] md:block">
          Cartas publicadas por la comunidad.
        </p>

        <form method="GET" className="mt-0 space-y-3 md:mt-4">
          <input type="hidden" name="tab" value={activeTab} />
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar Charizard, Mew, Paradox Rift..."
              className="pl-9"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr,1fr,1fr,1fr,auto]">
            <select
              name="condition"
              defaultValue={condition}
              className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 text-body-sm text-[var(--color-ink)]"
            >
              <option value="">Todas las condiciones</option>
              {CONDITIONS.map((item) => (
                <option key={item} value={item}>
                  {formatConditionEs(item)}
                </option>
              ))}
            </select>
            <select
              name="delivery"
              defaultValue={delivery}
              className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 text-body-sm text-[var(--color-ink)]"
            >
              <option value="">Envío o retiro</option>
              <option value="shipping">Con envío</option>
              <option value="pickup">Con retiro</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input name="min" defaultValue={min} type="number" min={1} placeholder="Min $" />
              <Input name="max" defaultValue={max} type="number" min={1} placeholder="Max $" />
            </div>
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 text-body-sm text-[var(--color-ink)]"
            >
              <option value="recent">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
            <Button type="submit" size="md">
              Buscar
            </Button>
          </div>
        </form>

        <div className="mt-3 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={getParamHref({ tab: t.key }, currentParams)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-colors",
                activeTab === t.key
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent-strong)]",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      <Card padding="md" className="border-dashed shadow-none">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-body-sm font-semibold text-[var(--color-ink)]">
              Formatos del mercado
            </p>
            <p className="text-caption text-[var(--color-ink-muted)]">
              Venta directa e intercambios desde perfiles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Venta directa", "Trades", "Mercado Pago"].map((label) => (
              <span
                key={label}
                className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-caption font-medium text-[var(--color-accent-strong)]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <p className="text-caption text-[var(--color-ink-muted)]">
        {total} {total === 1 ? "publicación" : "publicaciones"}
        {query && ` para "${q}"`}
        {condition && isCondition(condition) ? ` · ${formatConditionEs(condition)}` : ""}
        {delivery === "shipping" ? " · con envío" : delivery === "pickup" ? " · con retiro" : ""}
      </p>

      {total === 0 ? (
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
