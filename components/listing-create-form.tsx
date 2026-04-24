"use client";

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
      setError("Faltá el título del pack.");
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
      setSuccess("Pack publicado.");
      formEl.reset();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Error desconocido.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel p-5 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">
          Nuevo Mystery Pack
        </p>
        <p className="mt-1 text-sm text-black/70">
          Un pack sorpresa con varias cartas a un precio fijo. Para publicar una{" "}
          <strong>carta individual</strong>, cargala primero en{" "}
          <a href="/inventory" className="underline">Inventario</a> y tocá{" "}
          &quot;Publicar en Mercado&quot;.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-black/75 md:col-span-2">
          Título del pack
          <input
            name="packTitle"
            required
            placeholder="Pack Charizard vibes 5 cartas"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="text-sm text-black/75">
          Temática (opcional)
          <input
            name="packTheme"
            placeholder="Fire types, Trainers, Base Set..."
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="text-sm text-black/75">
          Cartas por pack
          <input
            name="packCardCount"
            type="number"
            min={1}
            max={50}
            defaultValue={5}
            required
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="text-sm text-black/75">
          Rareza piso garantizada
          <select
            name="packRarityFloor"
            defaultValue="rare"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          >
            {rarityFloors.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-black/75 md:col-span-2">
          Descripción (mín. 20 caracteres)
          <textarea
            name="packDescription"
            required
            minLength={20}
            className="mt-1 min-h-[90px] w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            placeholder="5 cartas random tipo fuego + 1 holo garantizada near_mint o mejor."
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-black/75">
          Condición mínima
          <select
            name="condition"
            defaultValue="near_mint"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          >
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {formatConditionEs(condition)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-black/75">
          Precio ARS
          <input
            name="priceArs"
            required
            type="number"
            min={1}
            placeholder="25000"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="text-sm text-black/75">
          Stock
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white/50 p-3 text-sm text-black/75">
        <p className="font-semibold text-black/85">Entrega del pack</p>
        <p className="mt-1 text-xs text-black/60">
          El comprador ve esto en el Mercado. Marcá al menos una opción y detallá dónde / cómo.
        </p>
        <label className="mt-2 flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="offersPickup" value="on" defaultChecked />
          Retiro en persona
        </label>
        <label className="mt-1 flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="offersShipping" value="on" />
          Envío postal / courier
        </label>
        <label className="mt-2 block text-sm text-black/75">
          Detalle (mín. 8 caracteres)
          <textarea
            name="deliveryAreaNotes"
            required
            minLength={8}
            rows={2}
            placeholder="Ej.: Retiro en Rosario centro / envío OCA a todo el país a cargo del comprador."
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Publicando..." : "Publicar pack"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
