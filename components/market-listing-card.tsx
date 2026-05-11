import Link from "next/link";
import type { Listing } from "@/lib/domain/types";
import type { PokemonTypeChip } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { Chip } from "@/components/ui/chip";

type Props = {
  listing: Listing;
  pokemonTypes: PokemonTypeChip[] | null;
  isLoggedIn: boolean;
};

export function MarketListingCard({ listing, pokemonTypes, isLoggedIn }: Props) {
  const sold = listing.status === "sold";
  const reserved = listing.status === "pending_payment";
  const formattedPrice = `$${listing.priceArs.toLocaleString("es-AR")}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all hover:border-[var(--color-ink)] hover:shadow-lg">
      <Link
        href={`/market/${listing.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-[var(--color-surface-muted)]"
        aria-label={`Ver ${listing.cardName}`}
      >
        {listing.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-caption text-[var(--color-ink-subtle)]">
            Sin foto
          </div>
        )}

        {/* Status Overlay */}
        {(sold || reserved) && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              sold ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-warning)] text-white"
            }`}>
              {sold ? "Vendida" : "Reservada"}
            </span>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute left-2 top-2">
          <span className="inline-block rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)]">
            {formatConditionEs(listing.condition)}
          </span>
        </div>

        {/* MP Badge */}
        <div className="absolute right-2 top-2">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur ${
              listing.sellerMpConnected
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
            }`}
            title={
              listing.sellerMpConnected
                ? "Mercado Pago conectado"
                : "Pago coordinado P2P"
            }
          >
            {listing.sellerMpConnected ? "MP" : "P2P"}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/market/${listing.id}`} className="group/link flex-1">
          {/* Price */}
          <p className="text-lg font-bold text-[var(--color-ink)]">
            {formattedPrice}
          </p>
          
          {/* Card Name */}
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-[var(--color-ink)] group-hover/link:underline">
            {listing.cardName}
          </h3>
          
          {/* Set Name */}
          <p className="mt-1 truncate text-xs text-[var(--color-ink-muted)]">
            {listing.setName}
          </p>
        </Link>

        {/* Pokemon Types */}
        {pokemonTypes && pokemonTypes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {pokemonTypes.slice(0, 2).map((t) => (
              <span
                key={t.name}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.labelEs}
              </span>
            ))}
          </div>
        )}

        {/* Seller Info */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <span className="truncate text-xs text-[var(--color-ink-subtle)]">
            @{listing.sellerHandle}
          </span>
          <span className="shrink-0 text-xs font-medium text-[var(--color-ink-muted)]">
            x{listing.quantity}
          </span>
        </div>

        {/* CTA */}
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
                className="block w-full rounded-lg bg-[var(--color-ink)] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-black transition-colors"
              >
                Ingresar para comprar
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
