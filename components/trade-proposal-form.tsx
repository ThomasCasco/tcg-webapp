"use client";

import { FormEvent, useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  CheckCircle,
} from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

type Props = {
  recipientId: string;
  recipientHandle: string;
  myInventory: InventoryEntry[];
  targetTradeCards: InventoryEntry[];
};

export function TradeProposalForm({
  recipientId,
  recipientHandle,
  myInventory,
  targetTradeCards,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [offered, setOffered] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, id: string, apply: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = String(new FormData(event.currentTarget).get("message") ?? "").trim();

    if (offered.size === 0 || requested.size === 0) {
      setError("Elegí al menos una carta para ofrecer y una para pedir.");
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/trade-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          recipientHandle,
          offeredInventoryIds: Array.from(offered),
          requestedInventoryIds: Array.from(requested),
          message,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear la propuesta.");
      event.currentTarget.reset();
      setOffered(new Set());
      setRequested(new Set());
      setSuccess("Propuesta enviada.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  if (myInventory.length === 0 || targetTradeCards.length === 0) {
    return null;
  }

  return (
    <Card padding="lg">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-input)] bg-[var(--color-ink)] text-[var(--color-ink-inverse)]">
          <ArrowLeftRight className="h-5 w-5" />
        </span>
        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">Trade</p>
          <h2 className="mt-1 text-h2 [font-family:var(--font-display)]">Proponer intercambio</h2>
          <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
            Elegí cartas de ambos lados para armar la oferta a <strong>@{recipientHandle}</strong>.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <TradePanel
            title="Vos ofrecés"
            count={offered.size}
            tone="ink"
            entries={myInventory}
            selected={offered}
            onToggle={(id) => toggle(offered, id, setOffered)}
            name="offeredInventoryIds"
            emptyText="No tenés cartas en inventario."
          />

          <div className="hidden flex-col items-center justify-center gap-2 md:flex">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-[var(--color-ink)]">
              <ArrowLeftRight className="h-5 w-5" />
            </span>
            <span className="text-caption font-semibold text-[var(--color-ink-muted)]">
              {offered.size} ↔ {requested.size}
            </span>
          </div>

          <TradePanel
            title="Pedís"
            count={requested.size}
            tone="accent"
            entries={targetTradeCards}
            selected={requested}
            onToggle={(id) => toggle(requested, id, setRequested)}
            name="requestedInventoryIds"
            emptyText="Esta persona no tiene cartas marcadas para trade."
          />
        </div>

        <FormField label="Mensaje" htmlFor="trade-message" hint="Contale cómo querés coordinar.">
          <Textarea
            id="trade-message"
            name="message"
            rows={3}
            maxLength={500}
            placeholder="Te ofrezco estas cartas, puedo coordinar por zona norte o envío."
          />
        </FormField>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            {error && (
              <p role="alert" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-danger)]">
                <AlertCircle className="h-4 w-4" />
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
                Tip: ofrecé y pedí cantidades parecidas para subir tu match rate.
              </p>
            )}
          </div>
          <Button
            type="submit"
            loading={loading}
            size="md"
            disabled={offered.size === 0 || requested.size === 0}
          >
            Enviar propuesta
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TradePanel({
  title,
  count,
  tone,
  entries,
  selected,
  onToggle,
  name,
  emptyText,
}: {
  title: string;
  count: number;
  tone: "ink" | "accent";
  entries: InventoryEntry[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  name: string;
  emptyText: string;
}) {
  return (
    <fieldset className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3">
      <legend className="sr-only">{title}</legend>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-body-sm font-bold text-[var(--color-ink)]">{title}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-caption font-bold",
            tone === "accent"
              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
              : "bg-[var(--color-ink)] text-[var(--color-ink-inverse)]",
          )}
        >
          {count} seleccionadas
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-caption text-[var(--color-ink-muted)]">{emptyText}</p>
      ) : (
        <ul className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {entries.map((entry) => {
            const active = selected.has(entry.id);
            return (
              <li key={entry.id}>
                <label
                  className={cn(
                    "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[var(--radius-input)] border bg-[var(--color-surface-elevated)] transition-colors",
                    active
                      ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30"
                      : "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
                  )}
                >
                  <input
                    type="checkbox"
                    name={name}
                    value={entry.id}
                    checked={active}
                    onChange={() => onToggle(entry.id)}
                    className="sr-only"
                  />
                  <span className="relative aspect-[3/4] block w-full overflow-hidden bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-accent-soft)]/30">
                    {entry.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.imageUrl}
                        alt={entry.cardName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-caption text-[var(--color-ink-subtle)]">
                        Sin foto
                      </span>
                    )}
                    {active && (
                      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-ink-inverse)] shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5 px-2 py-1.5">
                    <span className="line-clamp-1 text-caption font-semibold text-[var(--color-ink)]">
                      {entry.cardName}
                    </span>
                    <span className="line-clamp-1 text-[0.6875rem] text-[var(--color-ink-muted)]">
                      {entry.setName || "Sin set"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
