"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { CardCondition } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { CardPicker, type PickedCard } from "@/components/card-picker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
    <Card padding="md">
      <p className="text-overline text-[var(--color-ink-subtle)]">Nueva entrada</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <CardPicker onPick={setPicked} />
          <p className="mt-1 text-caption text-[var(--color-ink-subtle)]">
            Filtrá por set/expansión y buscá por nombre. Si no aparece la carta,
            usá la carga manual de abajo.
          </p>
        </div>

        <details className="rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-body-sm">
          <summary className="cursor-pointer text-[var(--color-ink-muted)]">
            Carga manual / Foto propia
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <FormField label="Carta (si no aparece en el buscador)" htmlFor="cardNameFallback">
              <Input
                id="cardNameFallback"
                name="cardNameFallback"
                placeholder="Pikachu ex"
              />
            </FormField>
            <FormField label="Set" htmlFor="setNameFallback">
              <Input
                id="setNameFallback"
                name="setNameFallback"
                placeholder="Paradox Rift"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField
                label="URL de foto propia (opcional)"
                htmlFor="imageUrlFallback"
                hint="Si dejás vacío usamos la imagen oficial del catálogo."
              >
                <Input
                  id="imageUrlFallback"
                  name="imageUrlFallback"
                  placeholder="https://... (pegá el link si subiste la foto en otro lado)"
                />
              </FormField>
            </div>
          </div>
        </details>

        <div className="grid gap-3 md:grid-cols-3">
          <FormField label="Condición" htmlFor="condition">
            <Select id="condition" name="condition" defaultValue="near_mint">
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {formatConditionEs(condition)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Cantidad" htmlFor="quantity">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
            />
          </FormField>

          <FormField label="Precio ARS" htmlFor="askingPriceArs">
            <Input
              id="askingPriceArs"
              name="askingPriceArs"
              type="number"
              min={1}
              placeholder="12000"
            />
          </FormField>
        </div>

        <Button type="submit" loading={loading}>
          Agregar al inventario
        </Button>

        {error ? (
          <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
        {success ? (
          <p role="status" className="text-body-sm text-[var(--color-success)]">{success}</p>
        ) : null}
      </form>
    </Card>
  );
}
