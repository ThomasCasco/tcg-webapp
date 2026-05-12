"use client";

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
import { CalendarClock, Gavel, Plus } from "@/components/ui/icon";

type Props = {
  inventory: InventoryEntry[];
  defaultOpen?: boolean;
};

type Mode = "now" | "scheduled";

/**
 * Datetime-local con un default de "mañana a las 20:00" (zona local del cliente).
 */
function defaultScheduledIso(): string {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(20, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(
    target.getDate(),
  )}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

export function AuctionCreateForm({ inventory, defaultOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("scheduled");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledIso());
  const [shipping, setShipping] = useState(true);
  const [pickup, setPickup] = useState(true);
  const [inventoryId, setInventoryId] = useState<string>("");

  const eligibleInventory = useMemo(
    () => inventory.filter((entry) => entry.quantity > 0),
    [inventory],
  );

  const selectedEntry = eligibleInventory.find((entry) => entry.id === inventoryId);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    if (!selectedEntry) {
      setError("Elegí una carta del inventario.");
      setLoading(false);
      return;
    }

    const payload = {
      inventoryId: selectedEntry.id,
      cardName: selectedEntry.cardName,
      setName: selectedEntry.setName,
      catalogCardId: selectedEntry.catalogCardId,
      imageUrl: selectedEntry.imageUrl,
      condition: selectedEntry.condition,
      quantity: Number(form.get("quantity") ?? 1),
      startPriceArs: Number(form.get("startPriceArs") ?? 0),
      bidIncrementArs: Number(form.get("bidIncrementArs") ?? 500),
      buyoutPriceArs: Number(form.get("buyoutPriceArs") ?? 0) || undefined,
      durationHours: Number(form.get("durationHours") ?? 24),
      scheduledStartAt:
        mode === "scheduled"
          ? new Date(scheduledAt).toISOString()
          : undefined,
      offersShipping: shipping,
      offersPickup: pickup,
      deliveryAreaNotes: String(form.get("deliveryAreaNotes") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la subasta.");
      }
      setSuccess(
        mode === "scheduled"
          ? "Subasta programada. Aparece en 'Próximas subastas'."
          : "Subasta activa.",
      );
      setInventoryId("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error desconocido.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (eligibleInventory.length === 0) {
    return (
      <Card padding="md">
        <p className="text-overline text-[var(--color-ink-subtle)]">Subastas</p>
        <h2 className="mt-1 text-h3">Necesitás cartas en tu inventario</h2>
        <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
          Para crear una subasta primero cargá la carta en tu inventario.
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
            <p className="text-overline text-[var(--color-ink-subtle)]">Subastas</p>
            <h2 className="mt-1 text-h3 flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Crear subasta
            </h2>
            <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
              Programá una subasta para que los coleccionistas se anoten antes
              de que arranque, o lanzala ahora mismo.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva subasta
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
          <p className="text-overline text-[var(--color-ink-subtle)]">Nueva subasta</p>
          <h2 className="mt-1 text-h3 flex items-center gap-2">
            <Gavel className="h-5 w-5" /> Configurá la subasta
          </h2>
        </div>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("scheduled")}
          className={`rounded-[var(--radius-input)] border px-3 py-2 text-body-sm font-semibold transition-colors ${
            mode === "scheduled"
              ? "border-transparent bg-[var(--accent)] text-white"
              : "border-[var(--glass-border)] bg-[var(--glass-fill)] text-[var(--ink)] hover:bg-[var(--glass-fill-hi)]"
          }`}
        >
          <CalendarClock className="mr-1 inline h-4 w-4" /> Programada
        </button>
        <button
          type="button"
          onClick={() => setMode("now")}
          className={`rounded-[var(--radius-input)] border px-3 py-2 text-body-sm font-semibold transition-colors ${
            mode === "now"
              ? "border-transparent bg-[var(--accent)] text-white"
              : "border-[var(--glass-border)] bg-[var(--glass-fill)] text-[var(--ink)] hover:bg-[var(--glass-fill-hi)]"
          }`}
        >
          <Gavel className="mr-1 inline h-4 w-4" /> Empezar ya
        </button>
      </div>

      <FormField label="Carta a subastar" required>
        <Select
          value={inventoryId}
          onChange={(event) => setInventoryId(event.target.value)}
          required
        >
          <option value="">Elegí una carta…</option>
          {eligibleInventory.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.cardName} — {entry.setName || "sin set"} (
              {formatConditionEs(entry.condition)}, stock {entry.quantity})
            </option>
          ))}
        </Select>
      </FormField>

      {selectedEntry ? (
        <div className="flex flex-wrap gap-2">
          <Chip>{formatConditionEs(selectedEntry.condition)}</Chip>
          {selectedEntry.setName ? <Chip variant="info">{selectedEntry.setName}</Chip> : null}
          <Chip variant="default">Stock {selectedEntry.quantity}</Chip>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Precio inicial (ARS)" required>
          <Input
            type="number"
            name="startPriceArs"
            min={1}
            step={100}
            required
            placeholder="1000"
          />
        </FormField>
        <FormField label="Incremento mínimo (ARS)" required>
          <Input
            type="number"
            name="bidIncrementArs"
            min={1}
            step={100}
            defaultValue={500}
            required
          />
        </FormField>
        <FormField label="Compra directa (ARS, opcional)" hint="Si alguien la ofrece, gana sin más pujas.">
          <Input type="number" name="buyoutPriceArs" min={0} step={100} placeholder="0 = no" />
        </FormField>
        <FormField label="Duración (horas)" required hint="Entre 1 y 168 (7 días).">
          <Input
            type="number"
            name="durationHours"
            min={1}
            max={168}
            defaultValue={24}
            required
          />
        </FormField>
        <FormField label="Cantidad" required>
          <Input
            type="number"
            name="quantity"
            min={1}
            max={selectedEntry?.quantity ?? 1}
            defaultValue={1}
            required
          />
        </FormField>
        {mode === "scheduled" ? (
          <FormField
            label="Inicio programado"
            required
            hint="Mientras tanto la subasta aparece como 'próxima'. Mínimo 5 min."
          >
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </FormField>
        ) : null}
      </div>

      <fieldset className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-3">
        <legend className="px-1 text-caption font-semibold text-[var(--color-ink-muted)]">
          Entrega
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-body-sm">
            <input
              type="checkbox"
              checked={shipping}
              onChange={(event) => setShipping(event.target.checked)}
            />
            Envío
          </label>
          <label className="flex items-center gap-2 text-body-sm">
            <input
              type="checkbox"
              checked={pickup}
              onChange={(event) => setPickup(event.target.checked)}
            />
            Retiro en persona
          </label>
        </div>
        <FormField className="mt-3" label="Notas de entrega" required>
          <Textarea
            name="deliveryAreaNotes"
            placeholder="Ej: Retiro CABA Centro, envío Andreani a cargo del comprador…"
            rows={2}
            required
          />
        </FormField>
      </fieldset>

      {error ? (
        <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
      {success ? (
        <p className="text-body-sm text-[var(--color-success)]">{success}</p>
      ) : null}

      <Button type="submit" disabled={loading} loading={loading}>
        {mode === "scheduled" ? "Programar subasta" : "Lanzar subasta"}
      </Button>
    </Card>
    </form>
  );
}
