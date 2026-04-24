import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      {!isSupabaseConfigured() ? (
        <section className="surface-panel border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Falta configurar Supabase en producción para abrir el marketplace a usuarios.
        </section>
      ) : null}

      {loadError ? (
        <section className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </section>
      ) : null}

      <section className="surface-panel p-6">
        <p className="text-xs uppercase tracking-[0.15em] text-black/55">
          Marketplace público
        </p>
        <h1 className="mt-1 text-4xl [font-family:var(--font-display)]">
          Comprar cartas y packs
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-black/70">
          Acá ves <strong>publicaciones activas</strong> de otros vendedores. Cuando reservás,
          la publicación pasa a <em>pago pendiente</em>: pagás directo al vendedor (Mercado Pago,
          transferencia, etc.) y después pegás el comprobante en{" "}
          <Link href="/transactions" className="underline">
            Transacciones
          </Link>
          . Si nadie paga a tiempo, la publicación vuelve sola a activa (revisá el cron de liberación
          en el README).
        </p>

        <form method="GET" className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar Charizard, Mew, Paradox Rift..."
            className="min-w-[260px] flex-1 rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
          >
            Buscar
          </button>
          <div className="flex rounded-full border border-[var(--color-border)] p-1 text-xs">
            {[
              { key: "all", label: "Todo" },
              { key: "cards", label: "Cartas" },
              { key: "packs", label: "Packs" },
            ].map((t) => (
              <Link
                key={t.key}
                href={`/market?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full px-3 py-1 ${
                  tab === t.key
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-black/60"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </form>
      </section>

      {enriched.length === 0 ? (
        <section className="surface-panel p-8 text-center text-sm text-black/65">
          <p className="font-medium text-black/80">Todavía no hay publicaciones que coincidan.</p>
          <p className="mt-2">
            Si vendés, cargá cartas en{" "}
            <Link href="/inventory" className="underline">
              Inventario
            </Link>{" "}
            y tocá <strong>Publicar en Mercado</strong>, o publicá un pack en{" "}
            <Link href="/listings" className="underline">
              Publicaciones
            </Link>
            .
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
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
