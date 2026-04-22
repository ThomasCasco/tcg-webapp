"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";

const conditionLabel: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  lightly_played: "Lightly Played",
  moderately_played: "Moderately Played",
  heavily_played: "Heavily Played",
  damaged: "Damaged",
};

const conditionBadge: Record<string, string> = {
  mint: "bg-emerald-100 text-emerald-800",
  near_mint: "bg-green-100 text-green-800",
  lightly_played: "bg-yellow-100 text-yellow-800",
  moderately_played: "bg-orange-100 text-orange-800",
  heavily_played: "bg-amber-100 text-amber-800",
  damaged: "bg-rose-100 text-rose-800",
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
  const [savingField, setSavingField] = useState<null | "edit" | "delete" | "publish">(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    Number(price || 0) !== (entry.askingPriceArs ?? 0) || quantity !== entry.quantity;

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
          imageUrl: entry.imageUrl,
          condition: entry.condition,
          priceArs: priceNum,
          quantity,
          listingType: "single",
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

  return (
    <article className="surface-panel flex gap-4 p-4">
      <div className="flex-shrink-0">
        {entry.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={entry.imageUrl}
            alt={entry.cardName}
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
            <h3 className="truncate text-base font-semibold">{entry.cardName}</h3>
            <p className="truncate text-xs text-black/60">
              {entry.setName || "Set sin especificar"}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${conditionBadge[entry.condition]}`}
          >
            {conditionLabel[entry.condition] ?? entry.condition}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-black/60">
            Precio ARS
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Cargá un precio"
              className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/75 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="text-xs text-black/60">
            Cantidad
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-white/75 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || savingField !== null}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
          >
            {savingField === "edit" ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={savingField !== null || alreadyListed}
            title={
              alreadyListed
                ? "Ya tenés una publicación activa con esta carta"
                : "Publicar en el Mercado con el precio cargado"
            }
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {alreadyListed
              ? "Ya publicada"
              : savingField === "publish"
                ? "Publicando..."
                : "Publicar en Mercado"}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={savingField !== null}
            className="ml-auto rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-black/65 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
          >
            {savingField === "delete" ? "Eliminando..." : "Eliminar"}
          </button>
        </div>

        {message ? (
          <p
            className={`text-xs ${
              message.kind === "ok" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </article>
  );
}
