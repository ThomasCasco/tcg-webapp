import Link from "next/link";
import { listings, reputationSnapshots } from "@/lib/domain/mock-data";

export default function MarketPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      <section className="surface-panel p-6">
        <p className="text-xs uppercase tracking-[0.15em] text-black/55">
          Marketplace publico
        </p>
        <h1 className="mt-1 text-4xl [font-family:var(--font-display)]">
          Buscar y comprar cartas
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Vista MVP de comprador con listings activos y reputacion del vendedor.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => {
          const reputation = reputationSnapshots[listing.sellerId];

          return (
            <article key={listing.id} className="surface-panel p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-black/55">
                {listing.setName}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{listing.cardName}</h2>
              <p className="mt-1 text-sm text-black/65">{listing.condition}</p>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="rounded-full bg-[#fff1da] px-3 py-1 font-semibold">
                  ARS {listing.priceArs.toLocaleString("es-AR")}
                </span>
                <span className="text-black/65">
                  Reputacion vendedor: {reputation?.score ?? 0}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
                >
                  Comprar (stub)
                </button>
                <Link
                  href="/login"
                  className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-white/70"
                >
                  Contactar
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}