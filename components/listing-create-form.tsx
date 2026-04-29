"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { CardCondition } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";

const conditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

const rarityFloors = [
  "common",
  "uncommon",
  "rare",
  "holo_rare",
  "ultra_rare",
  "secret_rare",
];

export function ListingCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(formEl);
    const payload = {
      listingType: "mystery_pack" as const,
      cardName: String(form.get("packTitle") ?? "").trim(),
      setName: String(form.get("packTheme") ?? "Mystery Pack"),
      condition: String(form.get("condition") ?? "near_mint"),
      priceArs: Number(form.get("priceArs") ?? 0),
      quantity: Number(form.get("quantity") ?? 1),
      packCardCount: Number(form.get("packCardCount") ?? 1),
      packRarityFloor: String(form.get("packRarityFloor") ?? "common"),
      packTheme: String(form.get("packTheme") ?? "").trim(),
      packDescription: String(form.get("packDescription") ?? "").trim(),
      offersShipping: form.get("offersShipping") === "on",
      offersPickup: form.get("offersPickup") === "on",
      deliveryAreaNotes: String(form.get("deliveryAreaNotes") ?? "").trim(),
    };

    if (!payload.cardName || payload.cardName.length < 2) {
      setError("Falta el título del pack.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la publicación.");
      }
      setSuccess("Pack publicado ✓");
      formEl.reset();
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Ocurrió un error. Probá de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Mystery Pack</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight">Publicar un pack sorpresa</h2>
          <p className="mt-1 text-xs muted">
            Para publicar una carta individual, hacelo desde{" "}
            <Link href="/inventory" className="font-semibold text-[var(--color-accent)] hover:underline">
              Inventario
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={open ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
        >
          {open ? "Cerrar" : "+ Nuevo pack"}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium md:col-span-2">
              Título del pack
              <input
                name="packTitle"
                required
                placeholder="Ej: Pack fuego 5 cartas + 1 holo"
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium">
              Temática (opcional)
              <input
                name="packTheme"
                placeholder="Fire types, Trainers, Base Set..."
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium">
              Cartas por pack
              <input
                name="packCardCount"
                type="number"
                min={1}
                max={50}
                defaultValue={5}
                required
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium">
              Rareza mínima garantizada
              <select name="packRarityFloor" defaultValue="rare" className="input mt-1">
                {rarityFloors.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">
              Condición mínima
              <select name="condition" defaultValue="near_mint" className="input mt-1">
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {formatConditionEs(condition)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium md:col-span-2">
              Descripción (mín. 20 caracteres)
              <textarea
                name="packDescription"
                required
                minLength={20}
                rows={3}
                placeholder="Ej: 5 cartas random tipo fuego + 1 holo garantizada near_mint o mejor."
                className="input mt-1"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium">
              Precio ARS
              <input
                name="priceArs"
                required
                type="number"
                min={1}
                placeholder="25000"
                className="input mt-1"
              />
            </label>
            <label className="text-xs font-medium">
              Stock
              <input
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className="input mt-1"
              />
            </label>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm">
            <p className="text-xs font-semibold">Entrega</p>
            <p className="mt-0.5 text-[11px] subtle">
              El comprador lo ve al reservar. Marcá al menos una opción.
            </p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                name="offersPickup"
                value="on"
                defaultChecked
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Retiro en persona
            </label>
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                name="offersShipping"
                value="on"
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Envío postal / courier
            </label>
            <label className="mt-2 block text-xs font-medium">
              Detalle (mín. 8 caracteres)
              <textarea
                name="deliveryAreaNotes"
                required
                minLength={8}
                rows={2}
                placeholder="Ej: Retiro en Rosario centro / envío OCA a todo el país."
                className="input mt-1"
              />
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Publicando..." : "Publicar pack"}
          </button>

          {error ? (
            <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">
              {success}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
