"use client";

import { FormEvent, useState } from "react";
import type { InventoryEntry } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const offeredInventoryIds = form.getAll("offeredInventoryIds").map(String);
    const requestedInventoryIds = form.getAll("requestedInventoryIds").map(String);
    const message = String(form.get("message") ?? "").trim();

    if (offeredInventoryIds.length === 0 || requestedInventoryIds.length === 0) {
      setError("Elegi al menos una carta para ofrecer y una carta para pedir.");
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
          offeredInventoryIds,
          requestedInventoryIds,
          message,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear la propuesta.");
      event.currentTarget.reset();
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
      <p className="text-overline text-[var(--color-ink-subtle)]">Trade</p>
      <h2 className="mt-1 text-h2">Proponer intercambio</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className="text-body-sm font-semibold">Ofreces</legend>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-[var(--color-border)] p-2">
              {myInventory.map((entry) => (
                <label key={entry.id} className="flex cursor-pointer gap-2 text-body-sm">
                  <input type="checkbox" name="offeredInventoryIds" value={entry.id} />
                  <span>
                    {entry.cardName}
                    <span className="text-[var(--color-ink-muted)]"> - {entry.setName || "Sin set"}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-body-sm font-semibold">Pedis</legend>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-[var(--color-border)] p-2">
              {targetTradeCards.map((entry) => (
                <label key={entry.id} className="flex cursor-pointer gap-2 text-body-sm">
                  <input type="checkbox" name="requestedInventoryIds" value={entry.id} />
                  <span>
                    {entry.cardName}
                    <span className="text-[var(--color-ink-muted)]"> - {entry.setName || "Sin set"}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <FormField label="Mensaje" htmlFor="trade-message">
          <Textarea
            id="trade-message"
            name="message"
            rows={3}
            maxLength={500}
            placeholder="Te ofrezco estas cartas, puedo coordinar por zona norte o envio."
          />
        </FormField>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={loading}>Enviar propuesta</Button>
          {error ? <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p> : null}
          {success ? <p role="status" className="text-body-sm text-[var(--color-success)]">{success}</p> : null}
        </div>
      </form>
    </Card>
  );
}
