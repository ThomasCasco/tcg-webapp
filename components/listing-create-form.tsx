"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import type { CardCondition } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, Package, Tag } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

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
    <Card padding="md">
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <FormatOption
          icon={<Tag className="h-4 w-4" />}
          title="Carta individual"
          body="Se crea desde Inventario con Publicar en Mercado."
          status="Activo"
        />
        <FormatOption
          icon={<Package className="h-4 w-4" />}
          title="Mystery Pack"
          body="Disponible aca para armar packs con precio fijo."
          status="Activo"
        />
        <FormatOption
          icon={<Gavel className="h-4 w-4" />}
          title="Subasta"
          body="Se crea desde Inventario con pujas, cierre y ganador."
          status="Activo"
        />
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <span>
            <span className="text-overline text-[var(--color-ink-subtle)]">Nuevo Mystery Pack</span>
            <span className="mt-1 block text-body-sm text-[var(--color-ink-muted)]">
              Publicá packs sorpresa. Las cartas individuales se publican desde Inventario.
            </span>
          </span>
          <span className="shrink-0 text-caption font-medium text-[var(--color-accent-strong)] group-open:hidden">
            Abrir
          </span>
          <span className="hidden shrink-0 text-caption font-medium text-[var(--color-ink-muted)] group-open:inline">
            Cerrar
          </span>
        </summary>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField label="Título del pack" htmlFor="packTitle" required>
              <Input
                id="packTitle"
                name="packTitle"
                required
                placeholder="Pack Charizard vibes 5 cartas"
              />
            </FormField>
          </div>
          <FormField label="Temática (opcional)" htmlFor="packTheme">
            <Input
              id="packTheme"
              name="packTheme"
              placeholder="Fire types, Trainers, Base Set..."
            />
          </FormField>
          <FormField label="Cartas por pack" htmlFor="packCardCount" required>
            <Input
              id="packCardCount"
              name="packCardCount"
              type="number"
              min={1}
              max={50}
              defaultValue={5}
              required
            />
          </FormField>
          <FormField label="Rareza piso garantizada" htmlFor="packRarityFloor">
            <Select id="packRarityFloor" name="packRarityFloor" defaultValue="rare">
              {rarityFloors.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </FormField>
          <div className="md:col-span-2">
            <FormField
              label="Descripción (mín. 20 caracteres)"
              htmlFor="packDescription"
              required
            >
              <Textarea
                id="packDescription"
                name="packDescription"
                required
                minLength={20}
                rows={3}
                placeholder="5 cartas random tipo fuego + 1 holo garantizada near_mint o mejor."
              />
            </FormField>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FormField label="Condición mínima" htmlFor="condition">
            <Select id="condition" name="condition" defaultValue="near_mint">
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {formatConditionEs(condition)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Precio ARS" htmlFor="priceArs" required>
            <Input
              id="priceArs"
              name="priceArs"
              required
              type="number"
              min={1}
              placeholder="25000"
            />
          </FormField>
          <FormField label="Stock" htmlFor="quantity">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
            />
          </FormField>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white/50 p-3 text-body-sm text-[var(--color-ink-muted)]">
          <p className="font-semibold text-[var(--color-ink)]">Entrega del pack</p>
          <p className="mt-1 text-caption text-[var(--color-ink-subtle)]">
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
          <div className="mt-2">
            <FormField label="Detalle (mín. 8 caracteres)" htmlFor="deliveryAreaNotes" required>
              <Textarea
                id="deliveryAreaNotes"
                name="deliveryAreaNotes"
                required
                minLength={8}
                rows={2}
                placeholder="Ej.: Retiro en Rosario centro / envío OCA a todo el país a cargo del comprador."
              />
            </FormField>
          </div>
        </div>

        <Button type="submit" loading={loading}>
          Publicar pack
        </Button>

        {error ? (
          <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
        {success ? (
          <p role="status" className="text-body-sm text-[var(--color-success)]">{success}</p>
        ) : null}
        </form>
      </details>
    </Card>
  );
}

function FormatOption({
  icon,
  title,
  body,
  status,
  muted = false,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  status: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-3",
        muted
          ? "border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body-sm font-semibold text-[var(--color-ink)]">
          {icon}
          {title}
        </span>
        <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--color-ink-subtle)]">
          {status}
        </span>
      </div>
      <p className="mt-2 text-caption text-[var(--color-ink-muted)]">{body}</p>
    </div>
  );
}
