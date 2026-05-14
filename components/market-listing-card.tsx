import Link from "next/link";
import type { Listing } from "@/lib/domain/types";
import type { PokemonTypeChip } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { PokemonTypeIcon } from "@/components/ui/pokemon-type-icon";

type Props = {
  listing: Listing;
  pokemonTypes: PokemonTypeChip[] | null;
  isLoggedIn: boolean;
  sellerReputation?: { average: number; count: number };
};

export function MarketListingCard({ listing, pokemonTypes, isLoggedIn, sellerReputation }: Props) {
  const sold = listing.status === "sold";
  const reserved = listing.status === "pending_payment";
  const formattedPrice = `ARS ${listing.priceArs.toLocaleString("es-AR")}`;

  return (
    <Card
      as="article"
      variant={listing.status === "active" ? "interactive" : "default"}
      padding="none"
      className="group flex flex-col overflow-hidden"
    >
      <Link
        href={`/market/${listing.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-[rgba(8,12,28,0.6)]"
        aria-label={`Ver ${listing.cardName}`}
      >
        {listing.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center t-xs t-soft">Sin foto</div>
        )}

        {(sold || reserved) && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
            <Chip variant={sold ? "default" : "warning"} size="md">
              {sold ? "Vendida" : "Reservada"}
            </Chip>
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <Chip size="sm" className="backdrop-blur">
            {formatConditionEs(listing.condition)}
          </Chip>
          {listing.sellerMpConnected ? (
            <Chip
              size="sm"
              variant="success"
              className="backdrop-blur"
              title="El vendedor tiene Mercado Pago conectado: verificación automática."
            >
              MP
            </Chip>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-[var(--hairline)] p-3">
        <Link href={`/market/${listing.id}`} className="group/link">
          <p className="t-mono text-[1.125rem] font-extrabold leading-tight text-[var(--ink)]">
            {formattedPrice}
          </p>
          <h3 className="mt-1 line-clamp-2 t-sm font-semibold leading-snug text-[var(--ink)] group-hover/link:text-[var(--accent-hi)]">
            {listing.cardName}
          </h3>
        </Link>
        <p className="truncate t-xs t-mute">{listing.setName}</p>

        {pokemonTypes && pokemonTypes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {pokemonTypes.slice(0, 3).map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: t.color }}
              >
                <PokemonTypeIcon type={t.name} size={11} />
                {t.labelEs}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-[var(--hairline)] pt-2 t-xs t-soft">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">@{listing.sellerHandle}</span>
            {sellerReputation && sellerReputation.count > 0 ? (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 font-semibold text-[var(--accent-hi)]"
                title={`${sellerReputation.count} calificaciones`}
              >
                ★ {sellerReputation.average.toFixed(1)}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 font-semibold text-[var(--ink)]">Stock {listing.quantity}</span>
        </div>

        {listing.status === "active" && (
          <div className="mt-3">
            {isLoggedIn ? (
              <ReserveListingButton
                listingId={listing.id}
                sellerMpConnected={listing.sellerMpConnected}
              />
            ) : (
              <Link
                href="/login"
                className="btn btn-primary block w-full text-center"
              >
                Iniciá sesión para comprar
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
