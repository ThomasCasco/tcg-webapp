import Link from "next/link";
import type { Listing } from "@/lib/domain/types";
import type { PokemonTypeChip } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { ReserveListingButton } from "@/components/reserve-listing-button";
import { WatchFromListingButton } from "@/components/watch-from-listing-button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

type Props = {
  listing: Listing;
  pokemonTypes: PokemonTypeChip[] | null;
  isLoggedIn: boolean;
};

export function MarketListingCard({ listing, pokemonTypes, isLoggedIn }: Props) {
  const isPack = listing.listingType === "mystery_pack";

  return (
    <Card as="article" variant="interactive" padding="md">
      <div className="flex gap-4">
        {listing.imageUrl && !isPack ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="h-28 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : isPack ? (
          <div className="grid h-28 w-20 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-rose-500 text-center text-[11px] font-bold uppercase tracking-widest text-white">
            Pack
          </div>
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-black/10 text-center text-[10px] text-black/50">
            Sin foto
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-overline text-[var(--color-ink-subtle)]">
            {isPack
              ? `Pack sorpresa · ${listing.packCardCount ?? "?"} cartas`
              : listing.setName}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{listing.cardName}</h2>
          {!isPack && pokemonTypes && pokemonTypes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {pokemonTypes.map((t) => (
                <span
                  key={t.name}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                  style={{ backgroundColor: t.color }}
                >
                  {t.labelEs}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
            {isPack
              ? `Rareza mín.: ${listing.packRarityFloor ?? "n/d"} · Tema: ${listing.packTheme ?? "mix"}`
              : `Condición: ${formatConditionEs(listing.condition)}`}
          </p>
          {isPack && listing.packDescription ? (
            <p className="mt-2 text-sm text-black/70">{listing.packDescription}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Chip variant="warning" size="md">
          ARS {listing.priceArs.toLocaleString("es-AR")}
        </Chip>
        <span className="text-body-sm text-[var(--color-ink-muted)]">Vendedor: {listing.sellerHandle}</span>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-xs text-black/75">
        <p className="font-semibold text-black/85">Entrega</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {listing.offersPickup ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-900">
              Retiro en persona
            </span>
          ) : null}
          {listing.offersShipping ? (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-900">
              Envío
            </span>
          ) : null}
          {!listing.offersPickup && !listing.offersShipping ? (
            <span className="text-amber-800">
              El vendedor no cargó opciones de entrega todavía: coordiná por chat antes de pagar.
            </span>
          ) : null}
        </div>
        {listing.deliveryAreaNotes ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-black/80">{listing.deliveryAreaNotes}</p>
        ) : listing.offersPickup || listing.offersShipping ? (
          <p className="mt-2 text-black/55">Pedile al vendedor que complete el detalle de zona o envío.</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {listing.status === "active" ? (
          isLoggedIn ? (
            <ReserveListingButton listingId={listing.id} />
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
            >
              Iniciá sesión para comprar
            </Link>
          )
        ) : (
          <span className="rounded-full bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-black/60">
            {listing.status === "pending_payment"
              ? "Reservado (pago pendiente)"
              : listing.status}
          </span>
        )}
        {isLoggedIn ? (
          <WatchFromListingButton
            query={listing.cardName.toLowerCase()}
            label={`Seguir ${listing.cardName.split(" ")[0]}`}
          />
        ) : null}
      </div>
    </Card>
  );
}
