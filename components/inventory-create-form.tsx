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
import { ImageUploader } from "@/components/ui/image-uploader";
import { Plus } from "@/components/ui/icon";

const conditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

type InventoryCreateFormProps = {
  defaultOpen?: boolean;
};

export function InventoryCreateForm({ defaultOpen = false }: InventoryCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedCard | null>(null);
  const [customName, setCustomName] = useState("");
  const [customSet, setCustomSet] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [availableForTrade, setAvailableForTrade] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(formEl);
    const cardName = picked?.name ?? customName.trim();
    const setName = picked?.setName ?? customSet.trim();

    if (!cardName || cardName.length < 2) {
      setError("Elegí una carta del buscador o escribí el nombre manualmente.");
      setLoading(false);
      return;
    }

    const payload = {
      cardName,
      setName: setName || undefined,
      catalogCardId: picked?.id,
      imageUrl: photoUrl ?? picked?.imageSmall ?? undefined,
      condition: String(form.get("condition") ?? "near_mint"),
      quantity: Number(form.get("quantity") ?? 1),
      askingPriceArs: Number(form.get("askingPriceArs") ?? 0) || undefined,
      availableForTrade,
      tradeNotes: String(form.get("tradeNotes") ?? "").trim() || undefined,
    };

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

      setSuccess("Carta agregada al inventario.");
      formEl.reset();
      setPicked(null);
      setCustomName("");
      setCustomSet("");
      setPhotoUrl(null);
      setAvailableForTrade(false);
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
    <Card padding="lg">
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[var(--color-accent-strong)]" />
            <span className="text-h3">Agregar carta al inventario</span>
          </span>
          <span className="text-caption font-medium text-[var(--color-accent-strong)] group-open:hidden">
            Abrir
          </span>
          <span className="hidden text-caption font-medium text-[var(--color-ink-muted)] group-open:inline">
            Cerrar
          </span>
        </summary>

        <form onSubmit={onSubmit} className="mt-5 space-y-5">
        {/* ── Card identity (catalog picker + manual fallback) ── */}
        <div className="space-y-2">
          <FormField label="Carta" htmlFor="card-picker">
            <CardPicker onPick={(p) => { setPicked(p); }} />
          </FormField>

          {!picked && (
            <details className="glass-soft group rounded-[var(--r-sm)] px-3 py-2">
              <summary className="cursor-pointer text-caption text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                ¿No la encontrás? Cargala manualmente
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FormField label="Nombre de la carta" htmlFor="customName">
                  <Input
                    id="customName"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Pikachu ex"
                  />
                </FormField>
                <FormField label="Set / expansión" htmlFor="customSet">
                  <Input
                    id="customSet"
                    value={customSet}
                    onChange={(e) => setCustomSet(e.target.value)}
                    placeholder="Paradox Rift"
                  />
                </FormField>
              </div>
            </details>
          )}
        </div>

        {/* ── Photo + condition + qty + price (mobile-first single col, desktop split) ── */}
        <div className="grid gap-5 md:grid-cols-[auto,1fr]">
          <div>
            <p className="mb-2 text-caption font-medium text-[var(--color-ink)]">Foto</p>
            <ImageUploader
              value={photoUrl ?? picked?.imageSmall ?? null}
              onChange={setPhotoUrl}
              variant="card"
              emptyLabel="Subir foto de la carta"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
              <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
            </FormField>

            <FormField label="Precio ARS" htmlFor="askingPriceArs" hint="Opcional. Lo podés cargar después.">
              <Input
                id="askingPriceArs"
                name="askingPriceArs"
                type="number"
                min={1}
                placeholder="12000"
              />
            </FormField>
          </div>
        </div>

        <div className="glass-soft rounded-[var(--r-sm)] p-3">
          <label className="flex cursor-pointer items-center gap-2 text-body-sm font-medium">
            <input
              type="checkbox"
              checked={availableForTrade}
              onChange={(e) => setAvailableForTrade(e.target.checked)}
            />
            Disponible para trade
          </label>
          {availableForTrade && (
            <FormField
              label="Notas de trade"
              htmlFor="tradeNotes"
              hint="Opcional. Ej: busco Charizard, prefiero CABA, escucho ofertas."
              className="mt-3"
            >
              <Input
                id="tradeNotes"
                name="tradeNotes"
                maxLength={240}
                placeholder="Busco cartas de Gengar o Mew"
              />
            </FormField>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={loading} size="md">
            Agregar al inventario
          </Button>
          {error && (
            <p role="alert" className="text-body-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-body-sm text-[var(--color-success)]">
              {success}
            </p>
          )}
        </div>
        </form>
      </details>
    </Card>
  );
}
