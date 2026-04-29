import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { WatchFromListingButton } from "@/components/watch-from-listing-button";
import { getListingById } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { fetchCatalogCardById } from "@/lib/server/tcgdex";

export const dynamic = "force-dynamic";

function getChipTextColor(hex: string): string {
  const value = hex.replace("#", "");
  const safe = value.length === 6 ? value : "888888";
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.64 ? "#0f172a" : "#ffffff";
}

const statusMeta: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "chip chip-success" },
  pending_payment: { label: "Pago pendiente", className: "chip chip-warning" },
  sold: { label: "Vendida", className: "chip" },
  cancelled: { label: "Cancelada", className: "chip" },
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  const listing = await getListingById(listingId, { onlyPublic: true });
  if (!listing) notFound();
  const catalog = listing.catalogCardId
    ? await fetchCatalogCardById(listing.catalogCardId).catch(() => null)
    : null;
  const image = listing.imageUrl ?? catalog?.imageLarge ?? catalog?.imageSmall ?? null;

  const isPack = listing.listingType === "mystery_pack";
  const pokemonTypes = isPack
    ? null
    : await getPokemonTypesForCardTitle(listing.cardName);
  const status = statusMeta[listing.status] ?? { label: listing.status, className: "chip" };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 md:py-8">
      <div>
        <Link
          href="/market"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
        >
          ← Volver al mercado
        </Link>
      </div>

      <section className="card overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[minmax(260px,340px)_1fr]">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-surface-muted)] md:aspect-auto md:h-full">
            {image && !isPack ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={image}
                alt={listing.cardName}
                className="h-full w-full object-cover"
              />
            ) : isPack ? (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--color-accent)] via-[#8b5cf6] to-[var(--color-info)] p-6 text-white">
                <div className="text-center">
                  <p className="text-6xl">🎴</p>
                  <p className="mt-3 text-sm font-bold uppercase tracking-widest">
                    Mystery Pack
                  </p>
                  <p className="text-xs opacity-85">{listing.packCardCount ?? "?"} cartas</p>
                </div>
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center subtle">
                <div className="text-center">
                  <p className="text-5xl opacity-30">🃏</p>
                  <p className="mt-2 text-xs uppercase tracking-widest">Sin foto</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="eyebrow">
                  {isPack ? "Mystery pack" : listing.setName || "Set sin especificar"}
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                  {listing.cardName}
                </h1>
              </div>
              <span className={status.className}>{status.label}</span>
            </div>

            {!isPack ? (
              <p className="text-sm muted">Condición: {formatConditionEs(listing.condition)}</p>
            ) : null}

            {pokemonTypes && pokemonTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {pokemonTypes.map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: t.color, color: getChipTextColor(t.color) }}
                  >
                    {t.labelEs}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="rounded-xl bg-[var(--color-surface-muted)] p-4">
              <p className="eyebrow">Precio</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                ARS {listing.priceArs.toLocaleString("es-AR")}
              </p>
              {catalog?.marketPriceEur || catalog?.marketPriceUsdEstimate ? (
                <div className="mt-2 space-y-0.5 text-xs muted">
                  <p className="font-medium">Referencia internacional:</p>
                  {catalog?.marketPriceEur ? (
                    <p>EUR {catalog.marketPriceEur.toFixed(2)} · Cardmarket</p>
                  ) : null}
                  {catalog?.marketPriceUsdEstimate ? (
                    <p>USD {catalog.marketPriceUsdEstimate.toFixed(2)} · estimado</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="subtle">Vendedor:</span>
                <span className="font-semibold">@{listing.sellerHandle}</span>
              </div>
              {catalog ? (
                <div className="text-xs muted">
                  {catalog.setName || listing.setName}
                  {catalog.number ? ` · Nº ${catalog.number}` : ""}
                  {catalog.setId ? ` · Set ${catalog.setId}` : ""}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {listing.status === "active" ? (
                user ? (
                  <ReserveListingButton listingId={listing.id} />
                ) : (
                  <Link href="/login" className="btn btn-primary">
                    Iniciá sesión para reservar
                  </Link>
                )
              ) : (
                <span className="chip">
                  {listing.status === "pending_payment" ? "Reservado (pago pendiente)" : listing.status}
                </span>
              )}
              {user && listing.status === "active" ? (
                <WatchFromListingButton
                  query={listing.cardName.toLowerCase()}
                  label={`Seguir ${listing.cardName.split(" ")[0]}`}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <p className="eyebrow">Entrega</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.offersPickup ? <span className="chip chip-info">Retiro en persona</span> : null}
          {listing.offersShipping ? <span className="chip chip-accent">Envío</span> : null}
          {!listing.offersPickup && !listing.offersShipping ? (
            <span className="chip chip-warning">A coordinar con el vendedor</span>
          ) : null}
        </div>
        {listing.deliveryAreaNotes ? (
          <p className="mt-3 whitespace-pre-wrap text-sm muted">{listing.deliveryAreaNotes}</p>
        ) : (
          <p className="mt-3 text-sm subtle">
            El vendedor no cargó detalle de zona. Coordinalo por chat antes de pagar.
          </p>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">Cómo funciona la compra</p>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          <li className="rounded-lg bg-[var(--color-surface-muted)] p-4">
            <p className="text-2xl font-bold text-[var(--color-accent)]">01</p>
            <p className="mt-1 text-sm font-semibold">Reservás</p>
            <p className="mt-0.5 text-xs muted">La publicación queda en pago pendiente a tu nombre.</p>
          </li>
          <li className="rounded-lg bg-[var(--color-surface-muted)] p-4">
            <p className="text-2xl font-bold text-[var(--color-accent)]">02</p>
            <p className="mt-1 text-sm font-semibold">Pagás al vendedor</p>
            <p className="mt-0.5 text-xs muted">Mercado Pago, transferencia o lo que acuerden.</p>
          </li>
          <li className="rounded-lg bg-[var(--color-surface-muted)] p-4">
            <p className="text-2xl font-bold text-[var(--color-accent)]">03</p>
            <p className="mt-1 text-sm font-semibold">Cargás el comprobante</p>
            <p className="mt-0.5 text-xs muted">En Operaciones para verificar y cerrar la venta.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
