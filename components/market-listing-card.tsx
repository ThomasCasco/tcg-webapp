import Link from "next/link";
import type { Listing } from "@/lib/domain/types";
import type { PokemonTypeChip } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

type Props = {
  listing: Listing;
  pokemonTypes: PokemonTypeChip[] | null;
  isLoggedIn: boolean;
};

export function MarketListingCard({ listing, pokemonTypes, isLoggedIn }: Props) {
  const sold = listing.status === "sold";
  const reserved = listing.status === "pending_payment";
  const formattedPrice = `ARS ${listing.priceArs.toLocaleString("es-AR")}`;

  return (
    <Card
      as="article"
      variant={listing.status === "active" ? "interactive" : "default"}
      padding="none"
      className="group min-w-0 flex flex-col overflow-hidden bg-white"
    >
      <Link
        href={`/market/${listing.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-[#f1f1ee]"
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
          <div className="grid h-full w-full place-items-center text-caption text-[var(--color-ink-subtle)]">
            Sin foto
          </div>
        )}

        {(sold || reserved) && (
          <div className="absolute inset-0 grid place-items-center bg-black/55">
            <Chip variant={sold ? "default" : "warning"} size="md">
              {sold ? "Vendida" : "Reservada"}
            </Chip>
          </div>
        )}

        <div className="absolute left-2 top-2">
          <Chip size="sm" variant="default" className="border-black bg-white/95 text-black backdrop-blur">
            {formatConditionEs(listing.condition)}
          </Chip>
        </div>

        <div className="absolute bottom-2 right-2 rounded-[var(--radius-input)] bg-black px-2 py-1 text-[0.6875rem] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
          Ver carta
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-[var(--color-border-subtle)] p-3">
        <Link href={`/market/${listing.id}`} className="group/link">
          <p className="truncate text-[1.0625rem] font-extrabold leading-tight text-[var(--color-ink)]">
            {formattedPrice}
          </p>
          <h3 className="mt-1 line-clamp-2 text-body-sm font-semibold text-[var(--color-ink)] group-hover/link:underline">
            {listing.cardName}
          </h3>
        </Link>
        <p className="truncate text-caption text-[var(--color-ink-muted)]">
          {listing.setName}
        </p>

        {pokemonTypes && pokemonTypes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {pokemonTypes.slice(0, 3).map((t) => (
              <span
                key={t.name}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.labelEs}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] pt-2 text-caption text-[var(--color-ink-subtle)]">
          <span className="truncate">@{listing.sellerHandle}</span>
          <span className="shrink-0 font-semibold text-[var(--color-ink)]">Stock {listing.quantity}</span>
        </div>

        {listing.status === "active" && (
          <div className="mt-3">
            {isLoggedIn ? (
              <ReserveListingButton listingId={listing.id} />
            ) : (
              <Link
                href="/login"
                className="block w-full rounded-[var(--radius-input)] bg-[var(--color-accent)] px-3 py-2 text-center text-[0.8125rem] font-semibold text-white hover:bg-[var(--color-accent-strong)]"
              >
                Inicia sesion para comprar
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
