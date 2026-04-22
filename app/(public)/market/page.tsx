import Link from "next/link";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { WatchFromListingButton } from "@/components/watch-from-listing-button";
import { listListings } from "@/lib/server/repository";
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      {!isSupabaseConfigured() ? (
        <section className="surface-panel border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Falta configurar Supabase en produccion para abrir el marketplace a usuarios.
        </section>
      ) : null}

      {loadError ? (
        <section className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </section>
      ) : null}

      <section className="surface-panel p-6">
        <p className="text-xs uppercase tracking-[0.15em] text-black/55">
          Marketplace publico
        </p>
        <h1 className="mt-1 text-4xl [font-family:var(--font-display)]">
          Buscar y comprar cartas
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Listings con catalogo oficial de Pokemon TCG + packs sorpresa.
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

      <section className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => {
          const isPack = listing.listingType === "mystery_pack";
          return (
            <article key={listing.id} className="surface-panel p-5">
              <div className="flex gap-4">
                {listing.imageUrl && !isPack ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={listing.imageUrl}
                    alt={listing.cardName}
                    className="h-28 w-20 rounded-lg object-cover"
                  />
                ) : isPack ? (
                  <div className="grid h-28 w-20 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-rose-500 text-center text-[11px] font-bold uppercase tracking-widest text-white">
                    Mystery Pack
                  </div>
                ) : null}
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-black/55">
                    {isPack
                      ? `Pack sorpresa · ${listing.packCardCount ?? "?"} cartas`
                      : listing.setName}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">{listing.cardName}</h2>
                  <p className="mt-1 text-sm text-black/65">
                    {isPack
                      ? `Rareza piso: ${listing.packRarityFloor ?? "n/d"} · Tematica: ${listing.packTheme ?? "mix"}`
                      : listing.condition}
                  </p>
                  {isPack && listing.packDescription ? (
                    <p className="mt-2 text-sm text-black/70">{listing.packDescription}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="rounded-full bg-[#fff1da] px-3 py-1 font-semibold">
                  ARS {listing.priceArs.toLocaleString("es-AR")}
                </span>
                <span className="text-black/65">Seller: {listing.sellerHandle}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {listing.status === "active" ? (
                  user ? (
                    <ReserveListingButton listingId={listing.id} />
                  ) : (
                    <Link
                      href="/login"
                      className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
                    >
                      Inicia sesion para comprar
                    </Link>
                  )
                ) : (
                  <span className="rounded-full bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-black/60">
                    {listing.status}
                  </span>
                )}
                {user ? (
                  <WatchFromListingButton
                    query={listing.cardName.toLowerCase()}
                    label={`Seguir ${listing.cardName.split(" ")[0]}`}
                  />
                ) : null}
              </div>
            </article>
          );
        })}
        {listings.length === 0 ? (
          <p className="text-sm text-black/60">Sin resultados.</p>
        ) : null}
      </section>
    </main>
  );
}
