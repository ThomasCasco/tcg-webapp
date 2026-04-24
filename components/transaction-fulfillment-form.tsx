"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { FulfillmentStatus } from "@/lib/domain/types";

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
    <form onSubmit={onSubmit} className="surface-panel p-5 space-y-3">
      <p className="text-xs uppercase tracking-[0.12em] text-black/55">
        Actualizar entrega / post-venta
      </p>
      <p className="text-xs text-black/60">
        Solo comprador y vendedor de esa operación. El envío lo marca el vendedor; &quot;Entregado&quot;
        lo confirma el comprador.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-black/75">
          Transaction ID
          <input
            name="transactionId"
            required
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            placeholder="tx_..."
          />
        </label>

        <label className="text-sm text-black/75">
          Estado
          <select
            name="status"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-black/75 md:col-span-2">
          Número de seguimiento (opcional)
          <input
            name="trackingNumber"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            placeholder="AR123456789"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Actualizando..." : "Actualizar estado"}
      </button>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
