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
      setError("Elegí una carta del buscador o escribí el nombre manualmente.");
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
        throw new Error(data.error ?? "No se pudo agregar la carta.");
      }

      setSuccess("Carta agregada a tu inventario ✓");
      formEl.reset();
      setPicked(null);
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
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Agregar carta</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight">Nueva entrada</h2>
        </div>
      </div>

      <div>
        <CardPicker onPick={setPicked} />
        <p className="mt-1.5 text-xs subtle">
          Filtrá por set y buscá por nombre. Si no aparece, usá la carga manual.
        </p>
      </div>

      <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm">
        <summary className="cursor-pointer font-medium muted">
          Carga manual / Foto propia
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium">
            Nombre de la carta
            <input
              name="cardNameFallback"
              placeholder="Ej: Pikachu ex"
              className="input mt-1"
            />
          </label>
          <label className="text-xs font-medium">
            Set / Expansión
            <input
              name="setNameFallback"
              placeholder="Ej: Paradox Rift"
              className="input mt-1"
            />
          </label>
          <label className="text-xs font-medium md:col-span-2">
            URL de foto propia (opcional)
            <input
              name="imageUrlFallback"
              placeholder="https://..."
              className="input mt-1"
            />
            <span className="mt-1 block text-[11px] subtle">
              Si lo dejás vacío usamos la imagen oficial del catálogo.
            </span>
          </label>
        </div>
      </details>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-medium">
          Condición
          <select name="condition" defaultValue="near_mint" className="input mt-1">
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {formatConditionEs(condition)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium">
          Cantidad
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            className="input mt-1"
          />
        </label>

        <label className="text-xs font-medium">
          Precio ARS (opcional)
          <input
            name="askingPriceArs"
            type="number"
            min={1}
            placeholder="12000"
            className="input mt-1"
          />
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "Guardando..." : "+ Agregar al inventario"}
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
  );
}
