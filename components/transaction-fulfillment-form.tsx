"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { FulfillmentStatus } from "@/lib/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const statuses: { value: FulfillmentStatus; label: string }[] = [
  { value: "seller_confirmed", label: "Pago OK — listo para enviar / retiro" },
  { value: "shipped", label: "Enviado (con tracking si aplica)" },
  { value: "delivered", label: "Entregado / recibido" },
  { value: "disputed", label: "Disputa" },
  { value: "closed", label: "Cerrado" },
];

export function TransactionFulfillmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const transactionId = String(form.get("transactionId") ?? "").trim();
    const status = String(form.get("status") ?? "seller_confirmed");
    const trackingNumber = String(form.get("trackingNumber") ?? "").trim();

    try {
      const response = await fetch(`/api/transactions/${transactionId}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || undefined,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo actualizar el estado.");
      }

      setMessage("Estado de fulfillment actualizado.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="md">
      <p className="text-overline text-[var(--color-ink-subtle)]">
        Actualizar entrega / post-venta
      </p>
      <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
        Solo comprador y vendedor de esa operación. El envío lo marca el vendedor; &quot;Entregado&quot;
        lo confirma el comprador.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Transaction ID" htmlFor="transactionId" required>
            <Input
              id="transactionId"
              name="transactionId"
              required
              placeholder="tx_..."
            />
          </FormField>

          <FormField label="Estado" htmlFor="status">
            <Select id="status" name="status">
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Número de seguimiento (opcional)" htmlFor="trackingNumber">
              <Input
                id="trackingNumber"
                name="trackingNumber"
                placeholder="AR123456789"
              />
            </FormField>
          </div>
        </div>

        <Button type="submit" loading={loading}>
          Actualizar estado
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
