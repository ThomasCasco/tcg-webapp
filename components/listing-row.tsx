"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";

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
  const [ok, setOk] = useState<string | null>(null);

  const [price, setPrice] = useState(String(listing.priceArs));
  const [quantity, setQuantity] = useState(listing.quantity);
  const [imageUrl, setImageUrl] = useState(listing.imageUrl ?? "");
  const [offersShipping, setOffersShipping] = useState(Boolean(listing.offersShipping));
  const [offersPickup, setOffersPickup] = useState(
    listing.offersPickup !== undefined ? Boolean(listing.offersPickup) : true,
  );
  const [deliveryNotes, setDeliveryNotes] = useState(listing.deliveryAreaNotes ?? "");

  const isPack = listing.listingType === "mystery_pack";

  const dirtyActive =
    listing.status === "active" &&
    (Number(price) !== listing.priceArs ||
      quantity !== listing.quantity ||
      imageUrl.trim() !== (listing.imageUrl ?? "").trim() ||
      offersShipping !== Boolean(listing.offersShipping) ||
      offersPickup !== Boolean(listing.offersPickup) ||
      deliveryNotes.trim() !== (listing.deliveryAreaNotes ?? "").trim());

  async function saveEdits() {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Precio ARS inválido.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const response = await fetch("/api/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listing.id,
          priceArs: priceNum,
          quantity,
          imageUrl: imageUrl.trim() || null,
          offersShipping,
          offersPickup,
          deliveryAreaNotes: deliveryNotes.trim() || null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setOk("Cambios guardados.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/upload/card-image", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { error?: string; url?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo subir la imagen.");
      if (data.url) setImageUrl(data.url);
      setOk("Imagen subida. Tocá Guardar para aplicarla a la publicación.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de subida.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm(`¿Cancelar la publicación de "${listing.cardName}"?`)) return;
    setBusy(true);
    setError(null);
    setOk(null);
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
        ) : (imageUrl.trim() || listing.imageUrl) && !isPack ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={(imageUrl.trim() || listing.imageUrl) as string}
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
            {!isPack ? (
              <p className="mt-1 text-[11px] text-black/55">
                Condición: {formatConditionEs(listing.condition)}
              </p>
            ) : null}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor[listing.status]}`}
          >
            {statusLabel[listing.status] ?? listing.status}
          </span>
        </div>

        {listing.status === "active" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-black/60">
              Precio ARS
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/75 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="text-xs text-black/60">
              Stock
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/75 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            {!isPack ? (
              <label className="text-xs text-black/60 sm:col-span-2">
                URL de imagen (o subí una foto)
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/75 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-1 block w-full text-[11px] text-black/60 file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
                  disabled={busy}
                  onChange={(e) => uploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
            ) : null}
            <div className="sm:col-span-2 rounded-lg border border-[var(--color-border)] bg-white/50 p-2 text-xs text-black/70">
              <p className="font-semibold text-black/80">Entrega</p>
              <label className="mt-1 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={offersPickup}
                  onChange={(e) => setOffersPickup(e.target.checked)}
                />
                Retiro en persona
              </label>
              <label className="mt-1 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={offersShipping}
                  onChange={(e) => setOffersShipping(e.target.checked)}
                />
                Envío postal / courier
              </label>
              <label className="mt-2 block text-black/60">
                Dónde y cómo
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/80 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-[var(--color-border)] bg-white/70 p-2">
              <p className="text-[10px] uppercase tracking-wide text-black/55">Precio</p>
              <p className="font-semibold">ARS {listing.priceArs.toLocaleString("es-AR")}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-white/70 p-2">
              <p className="text-[10px] uppercase tracking-wide text-black/55">Stock</p>
              <p className="font-semibold">{listing.quantity}</p>
            </div>
            {(listing.offersShipping ||
              listing.offersPickup ||
              listing.deliveryAreaNotes) ? (
              <div className="col-span-2 rounded-lg border border-[var(--color-border)] bg-amber-50/80 p-2 text-xs text-black/75">
                <p className="font-semibold text-black/80">Entrega acordada</p>
                <p className="mt-1">
                  {listing.offersPickup ? "· Retiro " : ""}
                  {listing.offersShipping ? "· Envío " : ""}
                </p>
                {listing.deliveryAreaNotes ? (
                  <p className="mt-1 whitespace-pre-wrap">{listing.deliveryAreaNotes}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-1 flex flex-wrap gap-2">
          {listing.status === "active" ? (
            <>
              <button
                type="button"
                onClick={saveEdits}
                disabled={busy || !dirtyActive}
                className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
              >
                {busy ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-black/65 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
              >
                {busy ? "..." : "Cancelar publicación"}
              </button>
            </>
          ) : null}
        </div>

        {listing.status === "pending_payment" && listing.reservedAt ? (
          <p className="text-[11px] text-amber-800">
            Reserva iniciada el{" "}
            {new Date(listing.reservedAt).toLocaleString("es-AR")}. Si no se verifica el pago,
            la publicación puede volver a activa (cron de liberación, típicamente 24 h).
          </p>
        ) : null}

        {ok ? <p className="text-xs text-emerald-700">{ok}</p> : null}
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
      </div>
    </article>
  );
}
