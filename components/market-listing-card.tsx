import Link from "next/link";
import type { Listing } from "@/lib/domain/types";
import type { PokemonTypeChip } from "@/lib/server/pokeapi";
import { formatConditionEs } from "@/lib/shared/condition-labels";

type Props = {
  listing: Listing;
  pokemonTypes: PokemonTypeChip[] | null;
  isLoggedIn: boolean;
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

const statusMeta: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "chip chip-success" },
  pending_payment: { label: "Pago pendiente", className: "chip chip-warning" },
  sold: { label: "Vendida", className: "chip" },
  cancelled: { label: "Cancelada", className: "chip" },
};

export function MarketListingCard({ listing, pokemonTypes, isLoggedIn }: Props) {
  const isPack = listing.listingType === "mystery_pack";
  const status = statusMeta[listing.status] ?? { label: listing.status, className: "chip" };

  return (
    <Link
      href={`/market/${listing.id}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
        {listing.imageUrl && !isPack ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : isPack ? (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--color-accent)] via-[#8b5cf6] to-[var(--color-info)] text-white">
            <div className="text-center">
              <p className="text-4xl">🎴</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest">
                Mystery Pack
              </p>
              <p className="text-[10px] opacity-80">{listing.packCardCount ?? "?"} cartas</p>
            </div>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center subtle">
            <div className="text-center">
              <p className="text-3xl opacity-40">🃏</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest">Sin foto</p>
            </div>
          </div>
        )}
        <div className="absolute left-2 top-2">
          <span className={status.className}>{status.label}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide subtle">
          {isPack
            ? `Tema: ${listing.packTheme ?? "mix"} · Rareza mín. ${listing.packRarityFloor ?? "n/d"}`
            : listing.setName || "Set sin especificar"}
        </p>
        <h2 className="mt-1 line-clamp-1 text-base font-bold tracking-tight">
          {listing.cardName}
        </h2>

        {!isPack && pokemonTypes && pokemonTypes.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {pokemonTypes.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: t.color, color: getChipTextColor(t.color) }}
              >
                {t.labelEs}
              </span>
            ))}
          </div>
        ) : null}

        {!isPack ? (
          <p className="mt-2 text-xs muted">{formatConditionEs(listing.condition)}</p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div className="price-tag">
              <span className="currency">ARS</span>
              <span className="amount">{listing.priceArs.toLocaleString("es-AR")}</span>
            </div>
            <span className="truncate text-xs subtle">@{listing.sellerHandle}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {listing.offersPickup ? (
              <span className="chip chip-info">Retiro</span>
            ) : null}
            {listing.offersShipping ? (
              <span className="chip chip-accent">Envío</span>
            ) : null}
          </div>

          {listing.status === "active" ? (
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)]">
              Ver detalle →
            </div>
          ) : !isLoggedIn ? (
            <div className="mt-3 inline-flex items-center gap-1 text-xs subtle">
              Iniciá sesión para comprar
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
