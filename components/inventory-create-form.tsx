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
import { ArrowLeftRight, CheckCircle, Plus, Star } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

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

  const displayName = picked?.name ?? (customName.trim() || null);
  const displaySet = picked?.setName ?? (customSet.trim() || null);
  const previewImage = photoUrl ?? picked?.imageSmall ?? null;
  const canSubmit = Boolean(displayName);

  return (
    <Card padding="none" className="overflow-hidden">
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-accent-soft)]/60 to-transparent px-5 py-4 transition-colors group-open:bg-[var(--color-surface-elevated)] hover:bg-[var(--color-accent-soft)]/80">
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-input)] bg-[var(--color-ink)] text-[var(--color-ink-inverse)] shadow-[var(--shadow-card)]">
              <Plus className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span className="text-h3 leading-tight">Agregar carta al inventario</span>
              <span className="text-caption text-[var(--color-ink-muted)]">
                Buscala en el catálogo o cargala manualmente
              </span>
            </span>
          </span>
          <span className="hidden shrink-0 rounded-full bg-[var(--color-ink)] px-3 py-1 text-caption font-semibold text-[var(--color-ink-inverse)] group-open:hidden sm:inline-flex">
            Abrir formulario
          </span>
          <span className="hidden shrink-0 text-caption font-medium text-[var(--color-ink-muted)] group-open:inline">
            Cerrar
          </span>
        </summary>

        <form onSubmit={onSubmit} className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
          {/* ── Main column: stepped fields ── */}
          <div className="space-y-6 p-5 md:p-6">
            {/* Step 1 — Identidad */}
            <section className="space-y-3">
              <StepHeader index={1} title="Buscá tu carta" subtitle="Tipeá un nombre y elegí del catálogo." />
              <CardPicker onPick={(p) => setPicked(p)} />

              {picked ? (
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="text-caption font-medium text-[var(--color-ink-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
                >
                  Cambiar carta
                </button>
              ) : (
                <details className="group/manual rounded-[var(--radius-input)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2">
                  <summary className="cursor-pointer select-none text-caption font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
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
            </section>

            <div className="h-px bg-[var(--color-border-subtle)]" />

            {/* Step 2 — Foto + detalles */}
            <section className="space-y-3">
              <StepHeader index={2} title="Foto y detalles" subtitle="Sumá una foto real y cargá la info técnica." />
              <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-2 sm:items-start">
                  <ImageUploader
                    value={photoUrl ?? picked?.imageSmall ?? null}
                    onChange={setPhotoUrl}
                    variant="card"
                    emptyLabel="Subir foto"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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

                  <FormField
                    label="Precio ARS"
                    htmlFor="askingPriceArs"
                    hint="Opcional · lo podés cargar después"
                    className="sm:col-span-2"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body-sm font-semibold text-[var(--color-ink-subtle)]">
                        $
                      </span>
                      <Input
                        id="askingPriceArs"
                        name="askingPriceArs"
                        type="number"
                        min={1}
                        placeholder="12000"
                        className="pl-7"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            <div className="h-px bg-[var(--color-border-subtle)]" />

            {/* Step 3 — Trade toggle */}
            <section className="space-y-3">
              <StepHeader index={3} title="Disponibilidad" subtitle="Definí si la querés tradear además de venderla." />
              <TradeToggle
                active={availableForTrade}
                onChange={setAvailableForTrade}
              />
              {availableForTrade && (
                <FormField
                  label="Notas de trade"
                  htmlFor="tradeNotes"
                  hint="Ej: busco Charizard, prefiero CABA, escucho ofertas."
                >
                  <Input
                    id="tradeNotes"
                    name="tradeNotes"
                    maxLength={240}
                    placeholder="Busco cartas de Gengar o Mew"
                  />
                </FormField>
              )}
            </section>

            {/* CTA + feedback */}
            <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                {error && (
                  <p role="alert" className="text-body-sm font-medium text-[var(--color-danger)]">
                    {error}
                  </p>
                )}
                {success && (
                  <p role="status" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-success)]">
                    <CheckCircle className="h-4 w-4" />
                    {success}
                  </p>
                )}
                {!error && !success && (
                  <p className="text-caption text-[var(--color-ink-subtle)]">
                    {canSubmit
                      ? "Listo para agregar — revisá la vista previa."
                      : "Elegí una carta para habilitar el botón."}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                loading={loading}
                size="lg"
                disabled={!canSubmit}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Agregar al inventario
              </Button>
            </div>
          </div>

          {/* ── Side column: live preview ── */}
          <aside className="hidden border-l border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-elevated)] p-5 md:block md:p-6">
            <p className="text-overline text-[var(--color-ink-subtle)]">Vista previa</p>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)]">
              <div className="aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-accent-soft)]/30">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt={displayName ?? "Vista previa"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-center text-caption text-[var(--color-ink-subtle)]">
                    <div className="flex flex-col items-center gap-2 px-4">
                      <Star className="h-6 w-6 opacity-50" />
                      <p>Tu carta aparece acá apenas la cargues.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-body-sm font-bold text-[var(--color-ink)]">
                  {displayName ?? "Sin elegir"}
                </p>
                {displaySet && (
                  <p className="line-clamp-1 text-caption text-[var(--color-ink-muted)]">
                    {displaySet}
                  </p>
                )}
                {availableForTrade && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-caption font-semibold text-[var(--color-accent-strong)]">
                    <ArrowLeftRight className="h-3 w-3" />
                    Disponible para trade
                  </span>
                )}
              </div>
            </div>
            <p className="mt-4 text-caption text-[var(--color-ink-subtle)]">
              La foto que subas pisa la del catálogo. Mostrá la carta real para
              generar confianza.
            </p>
          </aside>
        </form>
      </details>
    </Card>
  );
}

function StepHeader({
  index,
  title,
  subtitle,
}: {
  index: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-caption font-bold text-[var(--color-ink)]">
        {index}
      </span>
      <div className="flex flex-col">
        <h3 className="text-body-sm font-bold text-[var(--color-ink)]">{title}</h3>
        {subtitle && (
          <p className="text-caption text-[var(--color-ink-muted)]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function TradeToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left transition-colors",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/50"
          : "border-[var(--color-border-default)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-input)] transition-colors",
          active
            ? "bg-[var(--color-accent)] text-[var(--color-ink-inverse)]"
            : "bg-[var(--color-surface-elevated)] text-[var(--color-ink-muted)]",
        )}
      >
        <ArrowLeftRight className="h-5 w-5" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-body-sm font-semibold text-[var(--color-ink)]">
          Disponible para trade
        </span>
        <span className="text-caption text-[var(--color-ink-muted)]">
          Permití que otros usuarios te propongan intercambios.
        </span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          active ? "bg-[var(--color-accent)]" : "bg-[var(--color-border-default)]",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            active ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
