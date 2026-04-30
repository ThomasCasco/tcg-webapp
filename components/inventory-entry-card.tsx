"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { ChevronDown, ChevronUp, Tag, Trash2 } from "@/components/ui/icon";

const conditionVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  mint: "success",
  near_mint: "success",
  lightly_played: "warning",
  moderately_played: "warning",
  heavily_played: "danger",
  damaged: "danger",
};

type Props = {
  entry: InventoryEntry;
  alreadyListed: boolean;
};

type Panel = "none" | "edit" | "publish";

export function InventoryEntryCard({ entry, alreadyListed }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");

  // Edit state
  const [price, setPrice] = useState<string>(
    entry.askingPriceArs ? String(entry.askingPriceArs) : "",
  );
  const [quantity, setQuantity] = useState<number>(entry.quantity);
  const [imageUrl, setImageUrl] = useState<string | null>(entry.imageUrl ?? null);

  // Publish state
  const [offersShipping, setOffersShipping] = useState(false);
  const [offersPickup, setOffersPickup] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [busy, setBusy] = useState<null | "save" | "delete" | "publish">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    Number(price || 0) !== (entry.askingPriceArs ?? 0) ||
    quantity !== entry.quantity ||
    (imageUrl ?? "") !== (entry.imageUrl ?? "");

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          quantity,
          askingPriceArs: Number(price) || undefined,
          imageUrl: imageUrl || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setMsg({ kind: "ok", text: "Guardado." });
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error al guardar." });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${entry.cardName}" del inventario?`)) return;
    setBusy("delete");
    setMsg(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo eliminar.");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error al eliminar." });
      setBusy(null);
    }
  }

  async function publish() {
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setMsg({ kind: "err", text: "Cargá un precio antes de publicar." });
      return;
    }
    try {
      assertListingLogisticsValid(offersShipping, offersPickup, deliveryNotes);
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Revisá envío / retiro." });
      return;
    }
    setBusy("publish");
    setMsg(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: entry.id,
          cardName: entry.cardName,
          setName: entry.setName ?? "",
          catalogCardId: entry.catalogCardId,
          imageUrl: imageUrl ?? entry.imageUrl,
          condition: entry.condition,
          priceArs: priceNum,
          quantity,
          listingType: "single",
          offersShipping,
          offersPickup,
          deliveryAreaNotes: deliveryNotes.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo publicar.");
      setMsg({ kind: "ok", text: "Publicada en el Mercado." });
      setPanel("none");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error al publicar." });
    } finally {
      setBusy(null);
    }
  }

  const preview = imageUrl ?? entry.imageUrl;
  const priceNum = Number(price);
  const platformFee = priceNum > 0 ? Math.max(1, Math.round(priceNum * 0.01)) : 0;
  const netArs = priceNum - platformFee;

  return (
    <Card as="article" padding="md">
      {/* ── Header (always visible) ── */}
      <div className="flex gap-3">
        <div className="h-24 w-[68px] shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={entry.cardName} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-caption text-[var(--color-ink-subtle)]">
              Sin foto
            </div>
          )}
        </div>
      ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[1rem] font-semibold leading-tight">{entry.cardName}</h3>
              <p className="truncate text-caption text-[var(--color-ink-muted)]">
                {entry.setName || "Sin set"}
              </p>
            </div>
            <Chip variant={conditionVariant[entry.condition] ?? "default"} size="sm">
              {formatConditionEs(entry.condition)}
            </Chip>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-body-sm">
            <span>
              {entry.askingPriceArs ? (
                <strong>ARS {entry.askingPriceArs.toLocaleString("es-AR")}</strong>
              ) : (
                <span className="text-[var(--color-ink-subtle)]">Sin precio</span>
              )}
            </span>
            <span className="text-[var(--color-ink-muted)]">·</span>
            <span className="text-[var(--color-ink-muted)]">x{entry.quantity}</span>
            {alreadyListed && (
              <Chip variant="info" size="sm">Publicada</Chip>
            )}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={panel === "edit" ? "primary" : "secondary"}
          onClick={() => setPanel(panel === "edit" ? "none" : "edit")}
          disabled={busy !== null}
        >
          {panel === "edit" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Editar
        </Button>

        {!alreadyListed && (
          <Button
            size="sm"
            variant={panel === "publish" ? "primary" : "secondary"}
            onClick={() => setPanel(panel === "publish" ? "none" : "publish")}
            disabled={busy !== null}
          >
            <Tag className="h-4 w-4" />
            Publicar
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={busy !== null}
          loading={busy === "delete"}
          className="ml-auto hover:text-[var(--color-danger)]"
          aria-label="Eliminar carta"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Edit panel ── */}
      {panel === "edit" && (
        <div className="mt-4 space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
          <div className="grid gap-4 md:grid-cols-[auto,1fr]">
            <div>
              <p className="mb-2 text-caption font-medium">Foto</p>
              <ImageUploader value={imageUrl} onChange={setImageUrl} variant="card" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Precio ARS" htmlFor={`price-${entry.id}`}>
                <Input
                  id={`price-${entry.id}`}
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12000"
                />
              </FormField>
              <FormField label="Cantidad" htmlFor={`qty-${entry.id}`}>
                <Input
                  id={`qty-${entry.id}`}
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
              </FormField>
            </div>
          </div>

          <Button size="sm" onClick={save} disabled={!dirty || busy !== null} loading={busy === "save"}>
            Guardar cambios
          </Button>
        </div>
      )}

      {/* ── Publish panel ── */}
      {panel === "publish" && (
        <div className="mt-4 space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
          {!entry.askingPriceArs && (
            <FormField label="Precio ARS" htmlFor={`pub-price-${entry.id}`} required>
              <Input
                id={`pub-price-${entry.id}`}
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12000"
              />
            </FormField>
          )}

          {priceNum > 0 && (
            <div className="rounded-lg bg-[var(--color-info-soft)] p-3 text-caption">
              <p className="font-semibold text-[var(--color-ink)]">
                Te quedan ARS {netArs.toLocaleString("es-AR")}
              </p>
              <p className="text-[var(--color-ink-muted)]">
                Comisión plataforma 1 %: ARS {platformFee.toLocaleString("es-AR")}
              </p>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-caption font-medium">Entrega</legend>
            <label className="flex cursor-pointer items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={offersPickup}
                onChange={(e) => setOffersPickup(e.target.checked)}
              />
              Retiro en persona
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={offersShipping}
                onChange={(e) => setOffersShipping(e.target.checked)}
              />
              Envío a todo el país
            </label>
          </fieldset>

          <FormField
            label="Detalles de entrega"
            htmlFor={`delivery-${entry.id}`}
            hint="Zona, horarios, costo de envío. Mínimo 8 caracteres."
            required
          >
            <Textarea
              id={`delivery-${entry.id}`}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={2}
              placeholder="Retiro Caballito CABA · envío Andreani a cargo del comprador"
            />
          </FormField>

          <Button size="sm" onClick={publish} disabled={busy !== null} loading={busy === "publish"}>
            Publicar al Mercado
          </Button>
        </div>
      )}

      {msg && (
        <p
          role={msg.kind === "err" ? "alert" : "status"}
          className={`mt-3 text-body-sm ${
            msg.kind === "ok" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}
        >
          {msg.text}
        </p>
      )}
    </Card>
  );
}
