"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

const statusLabel: Record<string, string> = {
  active: "Activa",
  pending_payment: "Pago pendiente",
  sold: "Vendida",
  cancelled: "Cancelada",
};

const statusVariant: Record<string, "success" | "warning" | "default"> = {
  active: "success",
  pending_payment: "warning",
  sold: "default",
  cancelled: "default",
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
    <Card as="article" variant="default" padding="none" className="flex gap-4 p-4">
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
          <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-black/10 text-center text-caption text-[var(--color-ink-subtle)]">
            Sin foto
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{listing.cardName}</h3>
            <p className="truncate text-caption text-[var(--color-ink-muted)]">
              {isPack
                ? `Pack · ${listing.packCardCount ?? "?"} cartas · ${listing.packTheme ?? "mix"}`
                : listing.setName}
            </p>
            {!isPack ? (
              <p className="mt-1 text-caption text-[var(--color-ink-subtle)]">
                Condición: {formatConditionEs(listing.condition)}
              </p>
            ) : null}
          </div>
          <Chip variant={statusVariant[listing.status] ?? "default"} size="sm">
            {statusLabel[listing.status] ?? listing.status}
          </Chip>
        </div>

        {listing.status === "active" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-caption text-[var(--color-ink-muted)]">
              Precio ARS
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-0.5 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white/75 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="text-caption text-[var(--color-ink-muted)]">
              Stock
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="mt-0.5 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white/75 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            {!isPack ? (
              <label className="text-caption text-[var(--color-ink-muted)] sm:col-span-2">
                URL de imagen (o subí una foto)
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-0.5 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white/75 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-1 block w-full text-caption text-[var(--color-ink-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
                  disabled={busy}
                  onChange={(e) => uploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
            ) : null}
            <div className="sm:col-span-2 rounded-lg border border-[var(--color-border)] bg-white/50 p-2 text-caption text-[var(--color-ink-muted)]">
              <p className="font-semibold text-[var(--color-ink)]">Entrega</p>
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
              <label className="mt-2 block">
                Dónde y cómo
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/80 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-body-sm">
            <div className="rounded-lg border border-[var(--color-border)] bg-white/70 p-2">
              <p className="text-overline text-[var(--color-ink-subtle)]">Precio</p>
              <p className="font-semibold">ARS {listing.priceArs.toLocaleString("es-AR")}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-white/70 p-2">
              <p className="text-overline text-[var(--color-ink-subtle)]">Stock</p>
              <p className="font-semibold">{listing.quantity}</p>
            </div>
            {(listing.offersShipping || listing.offersPickup || listing.deliveryAreaNotes) ? (
              <div className="col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-warning-soft)] p-2 text-caption text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink)]">Entrega acordada</p>
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
              <Button
                type="button"
                size="sm"
                onClick={saveEdits}
                disabled={busy || !dirtyActive}
                loading={busy && dirtyActive}
              >
                Guardar cambios
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancel}
                disabled={busy}
                className="hover:text-[var(--color-danger)]"
              >
                {busy ? "..." : "Cancelar publicación"}
              </Button>
            </>
          ) : null}
        </div>

        {listing.status === "pending_payment" && listing.reservedAt ? (
          <p className="text-caption text-[var(--color-warning)]">
            Reserva iniciada el{" "}
            {new Date(listing.reservedAt).toLocaleString("es-AR")}. Si no se verifica el pago,
            la publicación puede volver a activa (cron de liberación, típicamente 24 h).
          </p>
        ) : null}

        {ok ? (
          <p role="status" className="text-caption text-[var(--color-success)]">{ok}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-caption text-[var(--color-danger)]">{error}</p>
        ) : null}
      </div>
    </Card>
  );
}
