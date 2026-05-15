"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/ui/chip";
import { Layers, Plus, Trash2 } from "@/components/ui/icon";

type Props = {
  inventory: InventoryEntry[];
  defaultOpen?: boolean;
};

type CardDraft = {
  inventoryEntryId: string;
  cardName: string;
  setName?: string;
  imageUrl?: string;
  condition: string;
  priceArs: number;
};

export function ClaimCreateForm({ inventory, defaultOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [pickedEntryId, setPickedEntryId] = useState("");

  const eligibleInventory = useMemo(
    () => inventory.filter((e) => e.quantity > 0),
    [inventory],
  );

  function addCard() {
    const entry = eligibleInventory.find((e) => e.id === pickedEntryId);
    if (!entry) return;
    setCards((prev) => [
      ...prev,
      {
        inventoryEntryId: entry.id,
        cardName: entry.cardName,
        setName: entry.setName,
        imageUrl: entry.imageUrl,
        condition: entry.condition,
        priceArs: entry.askingPriceArs ?? 0,
      },
    ]);
    setPickedEntryId("");
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePrice(index: number, value: string) {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, priceArs: Number(value) || 0 } : card)),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError("El título es obligatorio."); return; }
    if (cards.length === 0) { setError("Agregá al menos una carta."); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, cards }),
      });
      const data = await res.json() as { error?: string; id?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al crear la sesión.");
      setSuccess("Sesión creada. Ahora iniciala desde la lista.");
      setTitle("");
      setDescription("");
      setCards([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  if (eligibleInventory.length === 0) {
    return (
      <Card padding="md">
        <p className="text-overline text-[var(--color-ink-subtle)]">Claims</p>
        <h2 className="mt-1 text-h3 flex items-center gap-2">
          <Layers className="h-5 w-5" /> Nueva sesión de claims
        </h2>
        <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
          Cargá cartas en tu inventario para poder crear una sesión de claims.
        </p>
        <Button asChild className="mt-3" variant="secondary">
          <a href="/inventory">Ir al inventario</a>
        </Button>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card padding="md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Claims</p>
            <h2 className="mt-1 text-h3 flex items-center gap-2">
              <Layers className="h-5 w-5" /> Sesión de claims
            </h2>
            <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
              Revelá cartas de a una con precio fijo. El primero en claimear se la lleva.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva sesión
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Card padding="lg" className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Nueva sesión de claims</p>
            <h2 className="mt-1 text-h3">Configurá la sesión</h2>
          </div>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </header>

        <FormField label="Título" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Claims Pokémon Base Set — domingo 20hs"
            required
          />
        </FormField>

        <FormField label="Descripción (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contá de qué se trata, cuándo arranca, reglas, etc."
            rows={2}
          />
        </FormField>

        <fieldset className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-3">
          <legend className="px-1 text-caption font-semibold text-[var(--color-ink-muted)]">
            Cartas ({cards.length})
          </legend>

          {cards.length > 0 && (
            <ul className="space-y-2">
              {cards.map((card, i) => (
                <li key={i} className="flex items-center gap-3 rounded-[var(--radius-input)] border border-[var(--color-border-default)] p-2">
                  {card.imageUrl && (
                    <Image
                      src={card.imageUrl}
                      alt={card.cardName}
                      width={28}
                      height={40}
                      className="h-10 w-7 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold">{card.cardName}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {card.setName && <Chip size="sm" variant="info">{card.setName}</Chip>}
                      <Chip size="sm">{formatConditionEs(card.condition)}</Chip>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={card.priceArs}
                        onChange={(e) => updatePrice(i, e.target.value)}
                        placeholder="0 = free"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCard(i)}
                      className="rounded p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Select
              value={pickedEntryId}
              onChange={(e) => setPickedEntryId(e.target.value)}
              className="flex-1"
            >
              <option value="">Elegí una carta del inventario…</option>
              {eligibleInventory.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.cardName} — {entry.setName || "sin set"} ({formatConditionEs(entry.condition)})
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" onClick={addCard} disabled={!pickedEntryId}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </fieldset>

        {error && <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>}
        {success && <p className="text-body-sm text-[var(--color-success)]">{success}</p>}

        <Button type="submit" disabled={loading} loading={loading}>
          Crear sesión de claims
        </Button>
      </Card>
    </form>
  );
}
