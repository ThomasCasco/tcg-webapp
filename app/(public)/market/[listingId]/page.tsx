import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { WatchFromListingButton } from "@/components/watch-from-listing-button";
import { getListingById } from "@/lib/server/repository";
import { getSellerReputationSummary } from "@/lib/server/reputation/queries";
import type { SellerReputationSummary } from "@/lib/domain/reputation";
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
  Star,
  Truck,
  User,
} from "@/components/ui/icon";
import { getAppUrl } from "@/lib/shared/app-url";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

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
  pending_payment: { label: "Reservada: alguien la está pagando", variant: "warning" },
  sold: { label: "Vendida", variant: "default" },
  cancelled: { label: "Cancelada", variant: "default" },
};

export default async function ListingDetailPage({
  params,
}: PageProps) {
  const user = await getAuthenticatedUser();
  const { listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing) notFound();
  if (listing.listingType === "mystery_pack") notFound();

  const [catalog, pokemonTypes, sellerReputation] = await Promise.all([
    listing.catalogCardId
      ? fetchCatalogCardById(listing.catalogCardId).catch(() => null)
      : Promise.resolve(null),
    getPokemonTypesForCardTitle(listing.cardName),
    listing.sellerId
      ? getSellerReputationSummary(listing.sellerId).catch(() => null)
      : Promise.resolve(null),
  ]);
  const image = listing.imageUrl ?? catalog?.imageLarge ?? catalog?.imageSmall ?? null;
  // Sellers who skip the photo get the catalog scan; say so instead of passing it off as theirs.
  const isCatalogPhoto = !image || isCatalogImageUrl(image);
  const isPack = false;
  const canBuy = listing.status === "active" && listing.sellerMpConnected;
  const loginHref = `/login?next=${encodeURIComponent(`/market/${listing.id}`)}`;
  const status = statusMeta[listing.status] ?? {
    label: listing.status,
    variant: "default" as const,
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pb-28 pt-6 md:py-8">
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
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[rgba(8,12,28,0.6)] md:aspect-auto md:min-h-[520px]">
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={listing.cardName}
                  className="h-full w-full object-contain p-4"
                />
                {isCatalogPhoto ? (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 t-xs font-semibold text-white">
                    Foto de catálogo, no de la carta real
                  </span>
                ) : null}
              </>
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
                  {listing.setName || "Set sin especificar"}
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

            <div className="glass-soft rounded-[var(--r-md)] p-4">
              <p className="text-overline text-[var(--color-ink-subtle)]">Precio</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                ARS {listing.priceArs.toLocaleString("es-AR")}
              </p>
              {catalog?.marketPriceEur ? (
                <div className="mt-2 space-y-0.5 text-caption text-[var(--color-ink-muted)]">
                  <p>
                    Referencia en Europa (Cardmarket):{" "}
                    <span className="font-medium">EUR {catalog.marketPriceEur.toFixed(2)}</span>
                  </p>
                  <p>Precio promedio allá; no incluye envío ni costos de importación.</p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 text-body-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[var(--color-ink-subtle)]">Vendedor:</span>
                <Link
                  href={`/u/${encodeURIComponent(listing.sellerHandle)}`}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  @{listing.sellerHandle}
                </Link>
              </div>
              <SellerTrustBlock reputation={sellerReputation} sellerHandle={listing.sellerHandle} />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[var(--color-ink-subtle)]">Pago:</span>
                <Chip size="sm" variant="success" title="Le pagás directo al vendedor por Mercado Pago">
                  <CreditCard className="h-3 w-3" />
                  Mercado Pago a la cuenta del vendedor
                </Chip>
              </div>
              {catalog ? (
                <div className="text-caption text-[var(--color-ink-muted)]">
                  {catalog.setName || listing.setName}
                  {catalog.number ? ` · Nº ${catalog.number}` : ""}
                  {catalog.setId ? ` · Set ${catalog.setId}` : ""}
                </div>
              ) : null}
            </div>

            {/* Mobile: fixed to the bottom, within thumb reach. Desktop: inline. */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--hairline)] bg-[var(--bg-0)]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <div className="mx-auto flex max-w-6xl items-center gap-3">
                <p className="shrink-0 t-mono text-lg font-extrabold md:hidden">
                  ARS {listing.priceArs.toLocaleString("es-AR")}
                </p>
                <div className="min-w-0 flex-1 md:max-w-sm">
                  {canBuy ? (
                    user ? (
                      <ReserveListingButton listingId={listing.id} />
                    ) : (
                      <Button asChild fullWidth>
                        <Link href={loginHref}>Ingresá para comprar</Link>
                      </Button>
                    )
                  ) : (
                    <Chip>
                      {listing.status === "active"
                        ? "Este vendedor todavía no puede cobrar"
                        : status.label}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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
            El vendedor no cargó detalle de zona. Después de pagar lo coordinan por el chat de la operación.
          </p>
        )}
      </Card>

      <Card as="section" padding="lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--color-accent-strong)]" />
          <p className="text-overline text-[var(--color-ink-subtle)]">
            Cómo va a ser la compra
          </p>
        </div>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          <li className="glass-soft rounded-[var(--r-md)] p-4">
            <CheckCircle className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-body-sm font-semibold">1. Reservás</p>
            <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
              La carta queda reservada a tu nombre por 30 minutos mientras pagás.
            </p>
          </li>
          <li className="glass-soft rounded-[var(--r-md)] p-4">
            <CreditCard className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-body-sm font-semibold">
              2. Pagás por Mercado Pago
            </p>
            <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
              Le pagás directo al vendedor con la protección de Mercado Pago. El pago se confirma
              solo, sin capturas ni comprobantes.
            </p>
          </li>
          <li className="glass-soft rounded-[var(--r-md)] p-4">
            <Truck className="h-5 w-5 text-[var(--color-accent)]" />
            <p className="mt-2 text-body-sm font-semibold">3. Seguís la entrega</p>
            <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
              Chat, tracking y disputa quedan asociados a la operación.
            </p>
          </li>
        </ol>
        <p className="mt-3 text-caption text-[var(--color-ink-muted)]">
          Pagá siempre desde este botón: si alguien te pide una transferencia o un pago por
          afuera, no lo hagas y avisanos. Fuera de la app no podemos ayudarte.
        </p>
      </Card>
    </main>
  );
}

function isCatalogImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith("tcgdex.net") || host === "images.pokemontcg.io";
  } catch {
    return false;
  }
}

function SellerTrustBlock({
  reputation,
  sellerHandle,
}: {
  reputation: SellerReputationSummary | null;
  sellerHandle: string;
}) {
  if (!reputation || reputation.ratingCount === 0) {
    return (
      <div className="glass-soft rounded-[var(--r-md)] p-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--color-accent-strong)]" />
          <p className="text-body-sm font-semibold">@{sellerHandle} todavía no tiene calificaciones.</p>
        </div>
        <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
          Es un vendedor nuevo. Fijate las fotos y la condición antes de comprar.
        </p>
      </div>
    );
  }

  const tierLabel =
    reputation.tier === "elite"
      ? "Elite"
      : reputation.tier === "trusted"
        ? "Confiable"
        : "Nuevo";

  return (
    <div className="glass-soft rounded-[var(--r-md)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" variant={reputation.tier === "new" ? "info" : "success"}>
          <Star className="h-3 w-3 fill-current" />
          {reputation.averageRating.toFixed(1)} ({reputation.ratingCount})
        </Chip>
        <Chip size="sm">{reputation.completedSalesCount} ventas cerradas</Chip>
        <Chip size="sm" variant={reputation.disputeRate > 0.08 ? "warning" : "success"}>
          {(reputation.disputeRate * 100).toFixed(0)}% disputas
        </Chip>
        {reputation.verifiedSeller ? (
          <Chip size="sm" variant="success" title="Mercado Pago validó la identidad de esta cuenta">
            <ShieldCheck className="h-3 w-3" />
            Identidad validada por Mercado Pago
          </Chip>
        ) : null}
      </div>
      <p className="mt-2 text-caption text-[var(--color-ink-muted)]">
        Nivel {tierLabel}. Esta reputación se calcula con operaciones pagadas por la app,
        calificaciones y disputas.
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getListingById(listingId).catch(() => null);

  if (!listing || listing.listingType === "mystery_pack") {
    return {
      title: "Publicación no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const price = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(listing.priceArs);
  const title = `${listing.cardName} por ${price}`;
  const description = `${listing.cardName} (${formatConditionEs(listing.condition)}) en ${listing.setName}. Publicada por @${listing.sellerHandle} en TCG Marketplace AR.`;
  const url = `${getAppUrl()}/market/${listing.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: listing.imageUrl
        ? [{ url: listing.imageUrl, alt: listing.cardName }]
        : undefined,
    },
    twitter: {
      card: listing.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: listing.imageUrl ? [listing.imageUrl] : undefined,
    },
  };
}
