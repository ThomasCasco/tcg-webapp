import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { getSellerReputationSummaries, listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Filter, Search, ShoppingBag } from "@/components/ui/icon";
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

  const selectClass =
    "h-11 rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-md px-3.5 text-[var(--ink)] t-sm focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-glow),0.3)]";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-3 py-4 md:px-6 md:py-7">
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

      <header className="border-b border-[var(--hairline)] pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="t-eyebrow">Marketplace</p>
            <h1 className="mt-1 t-display text-[2.25rem] text-[var(--ink)] md:text-[3rem]">
              Mercado de cartas
            </h1>
            <p className="mt-2 max-w-2xl t-sm t-mute">
              Singles publicados por coleccionistas, con búsqueda directa, precio en pesos
              y filtros de compra.
            </p>
          </div>

          <Card variant="muted" padding="none" className="grid grid-cols-3 text-center md:min-w-80">
            <MarketMetric value={`${total}`} label="resultados" />
            <MarketMetric value="ARS" label="moneda" divider />
            <MarketMetric value="TCG" label="foco" divider />
          </Card>
        </div>
      </header>

      <section className="sticky top-14 z-10 -mx-3 border-b border-[var(--hairline)] bg-[var(--bg-0)]/95 px-3 py-3 backdrop-blur md:top-16 md:mx-0 md:rounded-[var(--r-md)] md:border md:bg-[var(--bg-1)] md:p-4">
        <form method="GET" className="space-y-3">
          <input type="hidden" name="tab" value={activeTab} />
          <div className="grid gap-2 md:grid-cols-[1fr,auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Buscar Charizard, Mew, Paradox Rift..."
                className="pl-10"
              />
            </div>
            <Button type="submit" size="md">
              <Filter className="h-4 w-4" />
              Aplicar
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr,1fr,1fr,1fr]">
            <select name="condition" defaultValue={condition} className={selectClass}>
              <option value="">Todas las condiciones</option>
              {CONDITIONS.map((item) => (
                <option key={item} value={item}>
                  {formatConditionEs(item)}
                </option>
              ))}
            </select>
            <select name="delivery" defaultValue={delivery} className={selectClass}>
              <option value="">Envío o retiro</option>
              <option value="shipping">Con envío</option>
              <option value="pickup">Con retiro</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input name="min" defaultValue={min} type="number" min={1} placeholder="Mín $" />
              <Input name="max" defaultValue={max} type="number" min={1} placeholder="Máx $" />
            </div>
            <select name="sort" defaultValue={sort} className={selectClass}>
              <option value="recent">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>
        </form>

        <div className="mt-3 flex gap-1.5 overflow-x-auto scroll-x">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={getParamHref({ tab: t.key }, currentParams)}
              className={cn("chip shrink-0", activeTab === t.key && "chip-active")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="t-xs font-semibold t-mute">
          {total} {total === 1 ? "publicación" : "publicaciones"}
          {query && ` para "${q}"`}
          {condition && isCondition(condition) ? ` · ${formatConditionEs(condition)}` : ""}
          {delivery === "shipping" ? " · con envío" : delivery === "pickup" ? " · con retiro" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {["Venta directa", "Trades", "Mercado Pago"].map((label) => (
            <span key={label} className="chip">
              {label}
            </span>
          ))}
        </div>
      </div>

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

function MarketMetric({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <div className={cn("px-3 py-3", divider && "border-l border-[var(--hairline)]")}>
      <p className="t-h3 t-mono font-extrabold">{value}</p>
      <p className="t-eyebrow">{label}</p>
    </div>
  );
}
