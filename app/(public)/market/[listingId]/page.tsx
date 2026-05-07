import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { WatchFromListingButton } from "@/components/watch-from-listing-button";
import { getListingById } from "@/lib/server/repository";
import { getPokemonTypesForCardTitle } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { fetchCatalogCardById } from "@/lib/server/tcgdex";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Package,
  ShieldCheck,
  Truck,
} from "@/components/ui/icon";

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

const statusMeta: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" }
> = {
  active: { label: "Activa", variant: "success" },
  pending_payment: { label: "Pago pendiente", variant: "warning" },
  sold: { label: "Vendida", variant: "default" },
  cancelled: { label: "Cancelada", variant: "default" },
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing) notFound();

  const catalog = listing.catalogCardId
    ? await fetchCatalogCardById(listing.catalogCardId).catch(() => null)
    : null;
  const image = listing.imageUrl ?? catalog?.imageLarge ?? catalog?.imageSmall ?? null;
  const isPack = listing.listingType === "mystery_pack";
  const pokemonTypes = isPack
    ? null
    : await getPokemonTypesForCardTitle(listing.cardName);
  const status = statusMeta[listing.status] ?? {
    label: listing.status,
    variant: "default" as const,
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 md:py-8">
      <div>
        <Link
          href="/market"
          className="inline-flex items-center gap-1 text-body-sm font-semibold text-[var(--color-accent-strong)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al mercado
        </Link>
      </div>

      <Card as="section" padding="none" className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-surface-muted)] md:aspect-auto md:min-h-[520px]">
            {image && !isPack ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={image}
                alt={listing.cardName}
                className="h-full w-full object-contain p-4"
              />
            ) : isPack ? (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--color-accent)] via-[#2b67a0] to-[#7a3f91] p-6 text-white">
                <div className="text-center">
                  <Package className="mx-auto h-14 w-14" />
                  <p className="mt-4 text-overline text-white/80">Mystery Pack</p>
                  <p className="mt-1 text-h3">{listing.packCardCount ?? "?"} cartas</p>
                </div>
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center text-[var(--color-ink-subtle)]">
                <div className="text-center">
                  <Package className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-2 text-overline">Sin foto</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-overline text-[var(--color-ink-subtle)]">
                  {isPack ? "Mystery pack" : listing.setName || "Set sin especificar"}
                </p>
                <h1 className="mt-1 text-h1 [font-family:var(--font-display)] md:text-display-md">
                  {listing.cardName}
                </h1>
              </div>
              <Chip variant={status.variant}>{status.label}</Chip>
            </div>

            {!isPack ? (
              <p className="text-body-sm text-[var(--color-ink-muted)]">
                Condición:{" "}
                <strong className="text-[var(--color-ink)]">
                  {formatConditionEs(listing.condition)}
                </strong>
              </p>
            ) : null}

            {pokemonTypes && pokemonTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {pokemonTypes.map((type) => (
                  <span
                    key={type.name}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      backgroundColor: type.color,
                      color: getChipTextColor(type.color),
                    }}
                  >
                    {type.labelEs}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-4">
              <p className="text-overline text-[var(--color-ink-subtle)]">Precio</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                ARS {listing.priceArs.toLocaleString("es-AR")}
              </p>
              {catalog?.marketPriceEur ? (
                <div className="mt-2 space-y-0.5 text-caption text-[var(--color-ink-muted)]">
                  <p className="font-medium">Referencia internacional:</p>
                  <p>EUR {catalog.marketPriceEur.toFixed(2)} · Cardmarket</p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 text-body-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[var(--color-ink-subtle)]">Vendedor:</span>
                <span className="font-semibold">@{listing.sellerHandle}</span>
                <Chip size="sm" variant="info">Perfil activo</Chip>
              </div>
              {catalog ? (
                <div className="text-caption text-[var(--color-ink-muted)]">
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
                  <Button asChild>
                    <Link href="/login">Iniciá sesión para reservar</Link>
                  </Button>
                )
              ) : (
                <Chip>
                  {listing.status === "pending_payment"
                    ? "Reservado (pago pendiente)"
                    : listing.status}
                </Chip>
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
      </Card>

      <Card as="section" padding="lg">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-[var(--color-accent-strong)]" />
          <p className="text-overline text-[var(--color-ink-subtle)]">Entrega</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.offersPickup ? <Chip variant="info">Retiro en persona</Chip> : null}
          {listing.offersShipping ? <Chip variant="accent">Envío</Chip> : null}
          {!listing.offersPickup && !listing.offersShipping ? (
            <Chip variant="warning">A coordinar con el vendedor</Chip>
          ) : null}
        </div>
        {listing.deliveryAreaNotes ? (
          <p className="mt-3 whitespace-pre-wrap text-body-sm text-[var(--color-ink-muted)]">
            {listing.deliveryAreaNotes}
          </p>
        ) : (
          <p className="mt-3 text-body-sm text-[var(--color-ink-subtle)]">
            El vendedor no cargó detalle de zona. Coordinalo por chat antes de pagar.
          </p>
        )}
      </Card>

      <Card as="section" padding="lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--color-accent-strong)]" />
          <p className="text-overline text-[var(--color-ink-subtle)]">Compra segura</p>
        </div>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          <li className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-4">
            <CheckCircle className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-body-sm font-semibold">Reservás</p>
            <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
              La publicación queda en pago pendiente a tu nombre.
            </p>
          </li>
          <li className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-4">
            <CreditCard className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-body-sm font-semibold">Pagás al vendedor</p>
            <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
              Mercado Pago automático si está conectado, o coordinación P2P.
            </p>
          </li>
          <li className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-4">
            <Truck className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-body-sm font-semibold">Seguís la entrega</p>
            <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
              Chat, tracking y disputa quedan asociados a la operación.
            </p>
          </li>
        </ol>
      </Card>
    </main>
  );
}
