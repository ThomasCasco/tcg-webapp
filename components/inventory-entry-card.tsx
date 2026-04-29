"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

const conditionVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  mint: "success",
  near_mint: "success",
  lightly_played: "warning",
  moderately_played: "warning",
  heavily_played: "danger",
  damaged: "danger",
};

type Props = {
  entry: InventoryEntry;
  alreadyListed: boolean;
};

export function InventoryEntryCard({ entry, alreadyListed }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState<string>(
    entry.askingPriceArs ? String(entry.askingPriceArs) : "",
  );
  const [quantity, setQuantity] = useState<number>(entry.quantity);
  const [imageUrl, setImageUrl] = useState(entry.imageUrl ?? "");
  const [offersShipping, setOffersShipping] = useState(false);
  const [offersPickup, setOffersPickup] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [savingField, setSavingField] = useState<null | "edit" | "delete" | "publish" | "upload">(
    null,
  );
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    Number(price || 0) !== (entry.askingPriceArs ?? 0) ||
    quantity !== entry.quantity ||
    imageUrl.trim() !== (entry.imageUrl ?? "").trim();

  async function save() {
    setSavingField("edit");
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
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error al guardar.",
      });
    } finally {
      setSavingField(null);
    }
  }

  async function uploadFile(file: File | null) {
    if (!file) return;
    setSavingField("upload");
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/upload/card-image", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { error?: string; url?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo subir.");
      if (data.url) {
        setImageUrl(data.url);
        setMessage({
          kind: "ok",
          text: "Imagen subida. Tocá Guardar para persistir en tu inventario.",
        });
      }
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error de subida.",
      });
    } finally {
      setSavingField(null);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${entry.cardName}" del inventario?`)) return;
    setSavingField("delete");
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
      setSavingField(null);
    }
  }

  async function publish() {
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setMessage({ kind: "err", text: "Cargá un precio ARS antes de publicar." });
      return;
    }
    try {
      assertListingLogisticsValid(offersShipping, offersPickup, deliveryNotes);
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Revisá envío / retiro.",
      });
      return;
    }
    setSavingField("publish");
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
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "err",
        text: error instanceof Error ? error.message : "Error al publicar.",
      });
    } finally {
      setSavingField(null);
    }
  }

  const preview = imageUrl.trim() || entry.imageUrl;

  return (
    <Card as="article" variant="default" padding="none" className="flex gap-4 p-4">
      <div className="flex-shrink-0">
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt={entry.cardName}
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
            <h3 className="truncate text-base font-semibold">{entry.cardName}</h3>
            <p className="truncate text-caption text-[var(--color-ink-muted)]">
              {entry.setName || "Set sin especificar"}
            </p>
          </div>
          <Chip variant={conditionVariant[entry.condition] ?? "default"} size="sm">
            {formatConditionEs(entry.condition)}
          </Chip>
        </div>

        <label className="text-caption text-[var(--color-ink-muted)]">
          URL de imagen (opcional)
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... o subí una foto abajo"
            className="mt-0.5 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white/75 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={savingField !== null}
          className="block w-full text-caption text-[var(--color-ink-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
          onChange={(e) => uploadFile(e.target.files?.[0] ?? null)}
        />

        <div className="rounded-lg border border-[var(--color-border)] bg-white/50 p-2 text-caption text-[var(--color-ink-muted)]">
          <p className="font-semibold text-[var(--color-ink)]">Entrega (visible en el Mercado)</p>
          <label className="mt-2 flex cursor-pointer items-center gap-2">
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
            Dónde y cómo (zona, horarios, costo de envío)
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={2}
              placeholder="Ej.: Retiro Caballito CABA lun–vie 18–21 h. Envío Andreani a todo el país, a cargo del comprador."
              className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/80 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-caption text-[var(--color-ink-muted)]">
            Precio ARS
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Cargá un precio"
              className="mt-0.5 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white/75 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="text-caption text-[var(--color-ink-muted)]">
            Cantidad
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="mt-0.5 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white/75 px-2 py-1 text-body-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        <div className="mt-1 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={!dirty || savingField !== null}
            loading={savingField === "edit"}
          >
            Guardar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={publish}
            disabled={savingField !== null || alreadyListed}
            loading={savingField === "publish"}
            title={
              alreadyListed
                ? "Ya tenés una publicación activa con esta carta"
                : "Publicar en el Mercado con el precio cargado"
            }
          >
            {alreadyListed ? "Ya publicada" : "Publicar en Mercado"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={remove}
            disabled={savingField !== null}
            loading={savingField === "delete"}
            className="ml-auto hover:text-[var(--color-danger)]"
          >
            Eliminar
          </Button>
        </div>

        {message ? (
          <p
            role={message.kind === "err" ? "alert" : "status"}
            className={`text-caption ${
              message.kind === "ok"
                ? "text-[var(--color-success)]"
                : "text-[var(--color-danger)]"
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
