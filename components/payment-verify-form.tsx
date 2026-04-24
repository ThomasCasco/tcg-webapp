"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type VerifyResponse = {
  error?: string;
  provider?: string;
  providerStatus?: string;
  providerStatusSource?: "provider_api" | "manual_payload";
  verificationStatus?: string;
  listingStatusAfterVerification?: string;
  checkedAt?: string;
};

const manualStatuses = ["pending", "approved", "rejected", "failed"];

export function PaymentVerifyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const transactionId = String(form.get("transactionId") ?? "").trim();
    const providerPaymentId = String(form.get("providerPaymentId") ?? "").trim();
    const providerStatus = String(form.get("providerStatus") ?? "pending").trim();

    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          providerPaymentId,
          providerStatus,
        }),
      });

      const data = (await response.json()) as VerifyResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo verificar el pago.");
      }

      const sourceLabel =
        data.providerStatusSource === "provider_api"
          ? "Consultamos la API del proveedor (MP/Stripe)."
          : "Estado cargado manualmente (pago externo o transferencia).";
      const verifiedHint =
        data.verificationStatus === "verified"
          ? " El pago figura como acreditado según el proveedor: el vendedor puede coordinar envío o retiro."
          : " Quedó en revisión: el vendedor puede pedirte comprobante por chat.";
      setSuccess(
        `Resultado: ${data.verificationStatus ?? "pending_review"} (${data.providerStatus ?? "pending"}) en ${data.provider ?? "proveedor"}. ${sourceLabel}${verifiedHint}`,
      );
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel p-5 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">Validar pago</p>
        <h2 className="mt-1 text-xl font-semibold">Paso rapido para confirmar cobro</h2>
        <p className="mt-1 text-sm text-black/70">
          Pegá el <strong>transaction ID</strong> que te dio la app al reservar y el{" "}
          <strong>ID de pago de Mercado Pago</strong> (o el identificador que corresponda). Si el
          proveedor es Mercado Pago o Stripe, validamos contra su API: eso no mueve dinero, solo
          confirma que el cobro existe y está aprobado.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-black/75">
          Transaction ID
          <input
            name="transactionId"
            required
            placeholder="tx_..."
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="text-sm text-black/75">
          ID de pago (MP o Stripe)
          <input
            name="providerPaymentId"
            required
            placeholder="123456789"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="text-sm text-black/75 md:col-span-2">
          Estado manual (solo si la transaccion es external_link)
          <select
            name="providerStatus"
            defaultValue="pending"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          >
            {manualStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Validando..." : "Validar pago"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
