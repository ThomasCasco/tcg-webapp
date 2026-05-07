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

/**
 * Vinted / Mercado Libre style vertical card.
 * Photo dominates the top, price + name compact below.
 */
export function MarketListingCard({ listing, pokemonTypes, isLoggedIn }: Props) {
  const isPack = listing.listingType === "mystery_pack";
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
      {/* ── Photo (3:4 aspect, photo-forward) ── */}
      <Link
        href={`/market/${listing.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-[var(--color-surface-elevated)]"
        aria-label={`Ver ${listing.cardName}`}
      >
        {listing.imageUrl && !isPack ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : isPack ? (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--color-accent)] via-[#2b67a0] to-[#7a3f91] text-center">
            <div>
              <p className="text-overline text-white/80">Pack sorpresa</p>
              <p className="mt-1 px-3 text-sm font-bold uppercase leading-tight tracking-wide text-white">
                {listing.packTheme || listing.cardName}
              </p>
              <p className="mt-2 text-caption text-white/85">
                {listing.packCardCount ?? "?"} cartas
              </p>
            </div>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center text-caption text-[var(--color-ink-subtle)]">
            Sin foto
          </div>
        )}

        {/* Status overlay */}
        {(sold || reserved) && (
          <div className="absolute inset-0 grid place-items-center bg-black/55">
            <Chip variant={sold ? "default" : "warning"} size="md">
              {sold ? "Vendida" : "Reservada"}
            </Chip>
          </div>
        )}

        {/* Condition badge (top-left) */}
        {!isPack && (
          <div className="absolute left-2 top-2">
            <Chip size="sm" variant="default" className="bg-white/95 backdrop-blur">
              {formatConditionEs(listing.condition)}
            </Chip>
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/market/${listing.id}`} className="group/link">
          <p className="text-[1.0625rem] font-bold leading-tight text-[var(--color-ink)] group-hover/link:text-[var(--color-accent-strong)]">
            {formattedPrice}
          </p>
          <h3 className="mt-1 line-clamp-2 text-body-sm font-medium text-[var(--color-ink)] group-hover/link:underline">
            {listing.cardName}
          </h3>
        </Link>
        <p className="truncate text-caption text-[var(--color-ink-muted)]">
          {isPack ? `Pack · ${listing.packTheme ?? "Mix"}` : listing.setName}
        </p>

        {/* Pokémon types pill row */}
        {!isPack && pokemonTypes && pokemonTypes.length > 0 && (
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

        {/* Seller line */}
        <p className="mt-1 truncate text-caption text-[var(--color-ink-subtle)]">
          @{listing.sellerHandle}
        </p>

        {/* Action area — only for active listings */}
        {listing.status === "active" && (
          <div className="mt-3">
            {isLoggedIn ? (
              <ReserveListingButton listingId={listing.id} />
            ) : (
              <Link
                href="/login"
                className="block w-full rounded-[var(--radius-input)] bg-[var(--color-accent)] px-3 py-2 text-center text-[0.8125rem] font-semibold text-white hover:bg-[var(--color-accent-strong)]"
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
