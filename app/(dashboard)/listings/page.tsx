import { listings } from "@/lib/domain/mock-data";

const listingStatusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending_payment: "bg-sky-100 text-sky-800",
  sold: "bg-blue-100 text-blue-800",
  cancelled: "bg-zinc-200 text-zinc-800",
};

export default function ListingsPage() {
  return (
    <section className="space-y-4">
      <div className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">
          Publicaciones
        </p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">
          Estado de listings
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Vista inicial para administrar precio, estado y conversion por carta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => (
          <article key={listing.id} className="surface-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-black/55">
                  Listing {listing.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{listing.cardName}</h2>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${listingStatusColors[listing.status]}`}
              >
                {listing.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[var(--color-border)] bg-white/70 p-3">
                <p className="text-black/55">Precio ARS</p>
                <p className="mt-1 font-semibold">
                  {listing.priceArs.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-white/70 p-3">
                <p className="text-black/55">Stock</p>
                <p className="mt-1 font-semibold">{listing.quantity}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}