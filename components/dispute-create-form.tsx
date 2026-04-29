"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DisputeCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      transactionId: String(form.get("transactionId") ?? ""),
      reason: String(form.get("reason") ?? ""),
      details: String(form.get("details") ?? ""),
    };

    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la disputa.");
      }

      setMessage("Disputa creada correctamente.");
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="md">
      <p className="text-overline text-[var(--color-ink-subtle)]">Abrir disputa</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <FormField label="Transaction ID" htmlFor="transactionId" required>
          <Input
            id="transactionId"
            name="transactionId"
            required
            placeholder="tx_..."
          />
        </FormField>

        <FormField label="Motivo" htmlFor="reason" required>
          <Input
            id="reason"
            name="reason"
            required
            placeholder="Carta no coincide con la descripción"
          />
        </FormField>

        <FormField label="Detalles" htmlFor="details" required>
          <Textarea
            id="details"
            name="details"
            required
            minLength={10}
            rows={4}
            placeholder="Describe el problema y adjunta evidencia en el siguiente paso operacional."
          />
        </FormField>

        <Button type="submit" loading={loading}>
          Crear disputa
        </Button>

        {message ? (
          <p role="status" className="text-body-sm text-[var(--color-success)]">{message}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
      </form>
    </Card>
  );
}
