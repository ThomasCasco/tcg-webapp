"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing } from "@/lib/domain/types";

const statusLabel: Record<string, string> = {
  active: "Activa",
  pending_payment: "Pago pendiente",
  sold: "Vendida",
  cancelled: "Cancelada",
};

const statusColor: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending_payment: "bg-sky-100 text-sky-800",
  sold: "bg-blue-100 text-blue-800",
  cancelled: "bg-zinc-200 text-zinc-700",
};

export function ListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPack = listing.listingType === "mystery_pack";

  async function cancel() {
    if (!confirm(`¿Cancelar la publicación de "${listing.cardName}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listing.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo cancelar.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar.");
      setBusy(false);
    }
  }

  return (
    <article className="surface-panel flex gap-4 p-4">
      <div className="flex-shrink-0">
        {isPack ? (
          <div className="grid h-32 w-24 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-rose-500 p-2 text-center text-[10px] font-bold uppercase tracking-widest text-white">
            Mystery Pack
          </div>
        ) : listing.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="h-32 w-24 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-black/10 text-center text-[10px] text-black/50">
            Sin foto
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{listing.cardName}</h3>
            <p className="truncate text-xs text-black/60">
              {isPack
                ? `Pack · ${listing.packCardCount ?? "?"} cartas · ${listing.packTheme ?? "mix"}`
                : listing.setName}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor[listing.status]}`}
          >
            {statusLabel[listing.status] ?? listing.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-[var(--color-border)] bg-white/70 p-2">
            <p className="text-[10px] uppercase tracking-wide text-black/55">Precio</p>
            <p className="font-semibold">
              ARS {listing.priceArs.toLocaleString("es-AR")}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white/70 p-2">
            <p className="text-[10px] uppercase tracking-wide text-black/55">Stock</p>
            <p className="font-semibold">{listing.quantity}</p>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-2">
          {listing.status === "active" ? (
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-black/65 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            >
              {busy ? "Cancelando..." : "Cancelar publicación"}
            </button>
          ) : null}
        </div>

        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
      </div>
    </article>
  );
}
