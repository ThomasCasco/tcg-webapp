import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import type { CardCondition } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const conditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];
const conditionLabel: Record<CardCondition, string> = {
  mint: "Mint",
  near_mint: "Near mint",
  lightly_played: "Lightly played",
  moderately_played: "Moderately played",
  heavily_played: "Heavily played",
  damaged: "Damaged",
};

function withParams(
  params: URLSearchParams,
  updates: Record<string, string | number | null | undefined>,
): string {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  return `/market?${next.toString()}`;
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    condition?: CardCondition;
    min?: string;
    max?: string;
    sort?: "created_desc" | "price_asc" | "price_desc";
    shipping?: "1";
    pickup?: "1";
    page?: string;
  }>;
}) {
  const user = await getAuthenticatedUser();
  const {
    tab = "all",
    q = "",
    condition,
    min = "",
    max = "",
    sort = "created_desc",
    shipping,
    pickup,
    page = "1",
  } = await searchParams;
  let listings: Awaited<ReturnType<typeof listListings>> = [];
  let loadError = false;

  const pageNumber = Math.max(1, Number(page) || 1);
  const minPrice = Number(min);
  const maxPrice = Number(max);
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (q.trim()) params.set("q", q.trim());
  if (condition && conditions.includes(condition)) params.set("condition", condition);
  if (Number.isFinite(minPrice) && minPrice > 0) params.set("min", String(Math.round(minPrice)));
  if (Number.isFinite(maxPrice) && maxPrice > 0) params.set("max", String(Math.round(maxPrice)));
  if (sort !== "created_desc") params.set("sort", sort);
  if (shipping === "1") params.set("shipping", "1");
  if (pickup === "1") params.set("pickup", "1");

  try {
    listings = await listListings({
      onlyPublic: true,
      listingType: tab === "cards" ? "single" : tab === "packs" ? "mystery_pack" : undefined,
      searchQuery: q.trim() || undefined,
      condition: condition && conditions.includes(condition) ? condition : undefined,
      minPriceArs: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : undefined,
      maxPriceArs: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
      offersShipping: shipping === "1" ? true : undefined,
      offersPickup: pickup === "1" ? true : undefined,
      sort,
      offset: (pageNumber - 1) * PAGE_SIZE,
      limit: PAGE_SIZE + 1,
    });
  } catch (error) {
    loadError = true;
    console.error("[market] listing load failed", error);
  }

  const hasNextPage = listings.length > PAGE_SIZE;
  const currentItems = hasNextPage ? listings.slice(0, PAGE_SIZE) : listings;
  const hasPrevPage = pageNumber > 1;

  const enriched = await Promise.all(
    currentItems.map(async (listing) => {
      const pokemonTypes =
        listing.listingType === "mystery_pack"
          ? null
          : await getPokemonTypesForCardTitle(listing.cardName);
      return { listing, pokemonTypes };
    }),
  );

  const tabs = [
    { key: "all", label: "Todo" },
    { key: "cards", label: "Cartas" },
    { key: "packs", label: "Mystery Packs" },
  ];

  const activeFilters =
    (q ? 1 : 0) +
    (condition ? 1 : 0) +
    (minPrice > 0 ? 1 : 0) +
    (maxPrice > 0 ? 1 : 0) +
    (shipping === "1" ? 1 : 0) +
    (pickup === "1" ? 1 : 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)] text-lg font-bold text-white shadow-sm">
            T
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">TCG Market</p>
            <p className="text-[10px] uppercase tracking-[0.15em] subtle">Mercado público</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <Link href="/inventory" className="btn btn-ghost btn-sm">
              Mi panel
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Ingresar
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      {!isSupabaseConfigured() || loadError ? (
        <div className="rounded-lg bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-warning)]">
          Estamos teniendo problemas para cargar las publicaciones. Probá refrescar en unos minutos.
        </div>
      ) : null}

      <section>
        <span className="eyebrow">Marketplace</span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
          Cartas y packs en venta
        </h1>
        <p className="mt-2 max-w-2xl text-sm muted">
          Publicaciones activas de la comunidad. Reservá, pagá directo al vendedor
          (Mercado Pago, transferencia) y cargá el comprobante en Operaciones.
        </p>
      </section>

      <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={withParams(params, { tab: t.key, page: 1 })}
            className={`flex-1 rounded-lg px-4 py-2 text-center font-medium transition-colors ${
              tab === t.key
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form method="GET" className="card p-4 md:p-5">
        <input type="hidden" name="tab" value={tab} />
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="block text-xs font-medium subtle">Buscar</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Charizard, Mew, Paradox Rift..."
              className="input mt-1"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium subtle">Condición</label>
            <select
              name="condition"
              defaultValue={condition ?? ""}
              className="input mt-1"
            >
              <option value="">Todas</option>
              {conditions.map((value) => (
                <option key={value} value={value}>
                  {conditionLabel[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium subtle">Precio mín.</label>
            <input
              name="min"
              type="number"
              min={1}
              defaultValue={min}
              placeholder="ARS"
              className="input mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium subtle">Precio máx.</label>
            <input
              name="max"
              type="number"
              min={1}
              defaultValue={max}
              placeholder="ARS"
              className="input mt-1"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium subtle">Ordenar</label>
            <select name="sort" defaultValue={sort} className="input mt-1">
              <option value="created_desc">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
          </div>
          <div className="md:col-span-5 flex flex-wrap items-end gap-4 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="shipping"
                value="1"
                defaultChecked={shipping === "1"}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Con envío
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="pickup"
                value="1"
                defaultChecked={pickup === "1"}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Con retiro
            </label>
          </div>
          <div className="md:col-span-3 flex items-end gap-2">
            {activeFilters > 0 ? (
              <Link href={`/market?tab=${tab}`} className="btn btn-ghost btn-sm flex-1">
                Limpiar
              </Link>
            ) : null}
            <button type="submit" className="btn btn-primary btn-sm flex-1">
              Aplicar
            </button>
          </div>
        </div>
      </form>

      {enriched.length === 0 ? (
        <section className="card p-10 text-center">
          <p className="text-4xl">🃏</p>
          <p className="mt-3 font-semibold">No encontramos publicaciones</p>
          <p className="mt-1 text-sm muted">
            Probá con otro filtro o{" "}
            <Link href="/market" className="font-semibold text-[var(--color-accent)] underline">
              limpiá la búsqueda
            </Link>
            .
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs subtle">
            <span>
              {currentItems.length} {currentItems.length === 1 ? "resultado" : "resultados"}
              {pageNumber > 1 ? ` · página ${pageNumber}` : ""}
            </span>
            {hasNextPage ? <span>hay más resultados</span> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enriched.map(({ listing, pokemonTypes }) => (
              <MarketListingCard
                key={listing.id}
                listing={listing}
                pokemonTypes={pokemonTypes}
                isLoggedIn={Boolean(user)}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            {hasPrevPage ? (
              <Link
                href={withParams(params, { page: pageNumber - 1 })}
                className="btn btn-ghost btn-sm"
              >
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            {hasNextPage ? (
              <Link
                href={withParams(params, { page: pageNumber + 1 })}
                className="btn btn-primary btn-sm"
              >
                Siguiente →
              </Link>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}
