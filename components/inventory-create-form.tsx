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
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--hairline)] px-5 py-4 transition-colors hover:bg-white/5 group-open:bg-white/5">
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-white shadow-[0_0_20px_rgba(var(--accent-glow),0.45)]">
              <Plus className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span className="t-h3 text-[var(--ink)]">Agregar carta al inventario</span>
              <span className="t-xs t-mute">Buscala en el catálogo o cargala manualmente</span>
            </span>
          </span>
          <span className="hidden shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 t-xs font-semibold text-white group-open:hidden sm:inline-flex">
            Abrir formulario
          </span>
          <span className="hidden shrink-0 t-xs font-semibold t-mute group-open:inline">
            Cerrar
          </span>
        </summary>

        <form onSubmit={onSubmit} className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 p-5 md:p-6">
            <section className="space-y-3">
              <StepHeader index={1} title="Buscá tu carta" subtitle="Tipeá un nombre y elegí del catálogo." />
              <CardPicker onPick={(p) => setPicked(p)} />

              {picked ? (
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="t-xs font-semibold t-mute underline-offset-2 hover:text-[var(--ink)] hover:underline"
                >
                  Cambiar carta
                </button>
              ) : (
                <details className="group/manual rounded-[var(--r-sm)] border border-dashed border-[var(--glass-border)] bg-white/[0.02] px-3 py-2">
                  <summary className="cursor-pointer select-none t-xs font-semibold t-mute hover:text-[var(--ink)]">
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

            <div className="h-px bg-[var(--hairline)]" />

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
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 t-sm font-semibold t-soft">
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

            <div className="h-px bg-[var(--hairline)]" />

            <section className="space-y-3">
              <StepHeader index={3} title="Disponibilidad" subtitle="Definí si la querés tradear además de venderla." />
              <TradeToggle active={availableForTrade} onChange={setAvailableForTrade} />
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

            <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                {error && (
                  <p role="alert" className="t-sm font-medium text-[var(--bad)]">{error}</p>
                )}
                {success && (
                  <p role="status" className="inline-flex items-center gap-1.5 t-sm font-medium text-[var(--ok)]">
                    <CheckCircle className="h-4 w-4" />
                    {success}
                  </p>
                )}
                {!error && !success && (
                  <p className="t-xs t-soft">
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

          <aside className="hidden border-l border-[var(--hairline)] bg-white/[0.02] p-5 md:block md:p-6">
            <p className="t-eyebrow">Vista previa</p>
            <div className="glass mt-3 overflow-hidden">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[var(--bg-2)]">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt={displayName ?? "Vista previa"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-center">
                    <div className="flex flex-col items-center gap-2 px-4">
                      <Star className="h-6 w-6 t-soft" />
                      <p className="t-xs t-soft">Tu carta aparece acá apenas la cargues.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 t-sm font-bold text-[var(--ink)]">
                  {displayName ?? "Sin elegir"}
                </p>
                {displaySet && (
                  <p className="line-clamp-1 t-xs t-mute">{displaySet}</p>
                )}
                {availableForTrade && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 t-xs font-semibold text-[var(--accent-hi)]">
                    <ArrowLeftRight className="h-3 w-3" />
                    Disponible para trade
                  </span>
                )}
              </div>
            </div>
            <p className="mt-4 t-xs t-soft">
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
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--glass-border-hi)] bg-white/5 t-xs font-bold text-[var(--ink)]">
        {index}
      </span>
      <div className="flex flex-col">
        <h3 className="t-sm font-bold text-[var(--ink)]">{title}</h3>
        {subtitle && <p className="t-xs t-mute">{subtitle}</p>}
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
        "flex w-full items-center gap-3 rounded-[var(--r-sm)] border p-3 text-left transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--glass-border)] bg-white/[0.02] hover:border-[var(--glass-border-hi)]",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-sm)] transition-colors",
          active
            ? "bg-[var(--accent)] text-white"
            : "bg-white/5 t-mute",
        )}
      >
        <ArrowLeftRight className="h-5 w-5" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="t-sm font-semibold text-[var(--ink)]">Disponible para trade</span>
        <span className="t-xs t-mute">Permití que otros usuarios te propongan intercambios.</span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          active ? "bg-[var(--accent)]" : "bg-white/15",
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
