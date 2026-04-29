"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";

const conditionBadge: Record<string, string> = {
  mint: "chip chip-success",
  near_mint: "chip chip-success",
  lightly_played: "chip chip-warning",
  moderately_played: "chip chip-warning",
  heavily_played: "chip chip-danger",
  damaged: "chip chip-danger",
};

type Props = {
  entry: InventoryEntry;
  alreadyListed: boolean;
};

export function InventoryEntryCard({ entry, alreadyListed }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "publish">("view");
  const [price, setPrice] = useState<string>(
    entry.askingPriceArs ? String(entry.askingPriceArs) : "",
  );
  const [quantity, setQuantity] = useState<number>(entry.quantity);
  const [imageUrl, setImageUrl] = useState(entry.imageUrl ?? "");
  const [offersShipping, setOffersShipping] = useState(false);
  const [offersPickup, setOffersPickup] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [busy, setBusy] = useState<null | "edit" | "delete" | "publish" | "upload">(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    Number(price || 0) !== (entry.askingPriceArs ?? 0) ||
    quantity !== entry.quantity ||
    imageUrl.trim() !== (entry.imageUrl ?? "").trim();

  async function save() {
    setBusy("edit");
    setMessage(null);
    try {
      const response = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          quantity,
          askingPriceArs: Number(price) || undefined,
          imageUrl: imageUrl.trim() || null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setMessage({ kind: "ok", text: "Guardado." });
      setMode("view");
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error al guardar.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function uploadFile(file: File | null) {
    if (!file) return;
    setBusy("upload");
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/upload/card-image", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { error?: string; url?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo subir la foto.");
      if (data.url) {
        setImageUrl(data.url);
        setMessage({
          kind: "ok",
          text: "Foto subida. Tocá Guardar para aplicarla.",
        });
      }
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error al subir la foto.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${entry.cardName}" del inventario?`)) return;
    setBusy("delete");
    setMessage(null);
    try {
      const response = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo eliminar.");
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error al eliminar.",
      });
      setBusy(null);
    }
  }

  async function publish() {
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setMessage({ kind: "err", text: "Poné un precio antes de publicar." });
      return;
    }
    try {
      assertListingLogisticsValid(offersShipping, offersPickup, deliveryNotes);
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Revisá las opciones de entrega.",
      });
      return;
    }
    setBusy("publish");
    setMessage(null);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: entry.id,
          cardName: entry.cardName,
          setName: entry.setName ?? "",
          catalogCardId: entry.catalogCardId,
          imageUrl: imageUrl.trim() || entry.imageUrl,
          condition: entry.condition,
          priceArs: priceNum,
          quantity,
          listingType: "single",
          offersShipping,
          offersPickup,
          deliveryAreaNotes: deliveryNotes.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo publicar.");
      setMessage({ kind: "ok", text: "¡Publicada en el Mercado!" });
      setMode("view");
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error al publicar.",
      });
    } finally {
      setBusy(null);
    }
  }

  const preview = imageUrl.trim() || entry.imageUrl;

  return (
    <article className="card card-hover overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="flex-shrink-0">
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt={entry.cardName}
              className="h-32 w-24 rounded-lg object-cover"
            />
          ) : (
            <div className="grid h-32 w-24 place-items-center rounded-lg bg-[var(--color-surface-muted)] subtle">
              <span className="text-2xl opacity-40">🃏</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold tracking-tight">{entry.cardName}</h3>
              <p className="truncate text-xs muted">
                {entry.setName || "Set sin especificar"}
              </p>
            </div>
            <span className={conditionBadge[entry.condition] ?? "chip"}>
              {formatConditionEs(entry.condition)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
              <p className="subtle">Stock</p>
              <p className="mt-0.5 font-semibold">{entry.quantity}</p>
            </div>
            <div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
              <p className="subtle">Precio</p>
              <p className="mt-0.5 font-semibold">
                {entry.askingPriceArs
                  ? `ARS ${entry.askingPriceArs.toLocaleString("es-AR")}`
                  : "Sin precio"}
              </p>
            </div>
          </div>

          {alreadyListed ? (
            <p className="chip chip-success w-max">✓ Publicada en Mercado</p>
          ) : null}

          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === "edit" ? "view" : "edit")}
              disabled={busy !== null}
              className="btn btn-ghost btn-sm"
            >
              {mode === "edit" ? "Cerrar" : "Editar"}
            </button>
            {!alreadyListed ? (
              <button
                type="button"
                onClick={() => setMode(mode === "publish" ? "view" : "publish")}
                disabled={busy !== null}
                className="btn btn-primary btn-sm"
              >
                {mode === "publish" ? "Cerrar" : "Publicar en Mercado"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className="btn btn-danger btn-sm ml-auto"
            >
              {busy === "delete" ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>

      {mode === "edit" ? (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
          <p className="eyebrow">Editar datos</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium">
              Stock
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium">
              Precio ARS
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej. 12000"
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium sm:col-span-2">
              URL de foto (opcional)
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium sm:col-span-2">
              O subir una foto propia
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={busy !== null}
                className="mt-1 block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[var(--color-accent-strong)]"
                onChange={(e) => uploadFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || busy !== null}
              className="btn btn-primary btn-sm"
            >
              {busy === "edit" ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={busy !== null}
              className="btn btn-ghost btn-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {mode === "publish" ? (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
          <p className="eyebrow">Publicar en el Mercado</p>
          {!entry.askingPriceArs && !Number(price) ? (
            <p className="mt-1 text-xs text-[var(--color-warning)]">
              Cargá primero un precio en Editar.
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            <label className="text-xs font-medium">
              Precio ARS
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input mt-1"
              />
            </label>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <p className="text-xs font-semibold">Entrega</p>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={offersPickup}
                  onChange={(e) => setOffersPickup(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Retiro en persona
              </label>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={offersShipping}
                  onChange={(e) => setOffersShipping(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Envío postal / courier
              </label>
              <label className="mt-2 block text-xs font-medium">
                Detalle de zona, horarios o costo de envío
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej.: Retiro Caballito lun–vie 18–21h. Envío Andreani a cargo del comprador."
                  className="input mt-1"
                />
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={publish}
              disabled={busy !== null}
              className="btn btn-primary btn-sm"
            >
              {busy === "publish" ? "Publicando..." : "Publicar ahora"}
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={busy !== null}
              className="btn btn-ghost btn-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div
          className={`border-t border-[var(--color-border)] px-4 py-2 text-xs ${
            message.kind === "ok"
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </article>
  );
}
