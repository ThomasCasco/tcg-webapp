import Link from "next/link";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <Card as="section" padding="md" className="border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">
            Falta configurar Supabase en producción para abrir el marketplace a usuarios.
          </p>
        </Card>
      ) : null}

      {loadError ? (
        <Card as="section" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error de backend: {loadError}</p>
        </Card>
      ) : null}

      <Card as="section" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Marketplace público
        </p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Comprar cartas y packs
        </h1>
        <p className="mt-2 max-w-2xl text-body-sm text-[var(--color-ink-muted)]">
          Acá ves <strong>publicaciones activas</strong> de otros vendedores. Cuando reservás,
          la publicación pasa a <em>pago pendiente</em>: pagás directo al vendedor (Mercado Pago,
          transferencia, etc.) y después pegás el comprobante en{" "}
          <Link href="/transactions" className="underline">
            Transacciones
          </Link>.
        </p>

        <form method="GET" className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value={tab} />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar Charizard, Mew, Paradox Rift..."
            className="min-w-[220px] flex-1"
          />
          <Button type="submit" size="sm">
            Buscar
          </Button>
          <div className="flex rounded-full border border-[var(--color-border)] p-1 text-xs">
            {[
              { key: "all", label: "Todo" },
              { key: "cards", label: "Cartas" },
              { key: "packs", label: "Packs" },
            ].map((t) => (
              <Link
                key={t.key}
                href={`/market?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full px-3 py-1 transition-colors ${
                  tab === t.key
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-ink-muted)] hover:bg-black/5"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </form>
      </Card>

      {enriched.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Sin publicaciones"
          description={
            <>
              <p>Todavía no hay publicaciones que coincidan.</p>
              <p className="mt-1">
                Si vendés, cargá cartas en{" "}
                <Link href="/inventory" className="underline">Inventario</Link>{" "}
                y tocá <strong>Publicar en Mercado</strong>.
              </p>
            </>
          }
        />
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
