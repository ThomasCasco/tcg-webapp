"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { CardCondition } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { CardPicker, type PickedCard } from "@/components/card-picker";

const conditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

export function InventoryCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedCard | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(formEl);
    const manualImageUrl = String(form.get("imageUrlFallback") ?? "").trim();
    const payload = {
      cardName: picked?.name ?? String(form.get("cardNameFallback") ?? ""),
      setName: picked?.setName ?? String(form.get("setNameFallback") ?? ""),
      catalogCardId: picked?.id,
      imageUrl: manualImageUrl || picked?.imageSmall || undefined,
      condition: String(form.get("condition") ?? "near_mint"),
      quantity: Number(form.get("quantity") ?? 1),
      askingPriceArs: Number(form.get("askingPriceArs") ?? 0) || undefined,
    };

    if (!payload.cardName || payload.cardName.length < 2) {
      setError("Elegi una carta del buscador o escribi el nombre manualmente.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la entrada de inventario.");
      }

      setSuccess("Carta agregada a tu inventario.");
      formEl.reset();
      setPicked(null);
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
      <p className="text-xs uppercase tracking-[0.12em] text-black/55">
        Nueva entrada
      </p>

      <div>
        <CardPicker onPick={setPicked} />
        <p className="mt-1 text-xs text-black/55">
          Filtrá por set/expansión y buscá por nombre. Si no aparece la carta,
          usá la carga manual de abajo.
        </p>
      </div>

      <details className="rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-sm">
        <summary className="cursor-pointer text-black/65">
          Carga manual / Foto propia
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-black/75">
            Carta (si no aparece en el buscador)
            <input
              name="cardNameFallback"
              placeholder="Pikachu ex"
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="text-sm text-black/75">
            Set
            <input
              name="setNameFallback"
              placeholder="Paradox Rift"
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="text-sm text-black/75 md:col-span-2">
            URL de foto propia (opcional)
            <input
              name="imageUrlFallback"
              placeholder="https://... (pegá el link si subiste la foto en otro lado)"
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            />
            <span className="mt-1 block text-xs text-black/55">
              Si dejás vacío usamos la imagen oficial del catálogo.
            </span>
          </label>
        </div>
      </details>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-black/75">
          Condicion
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
          Cantidad
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="text-sm text-black/75">
          Precio ARS
          <input
            name="askingPriceArs"
            type="number"
            min={1}
            placeholder="12000"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Agregar al inventario"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
