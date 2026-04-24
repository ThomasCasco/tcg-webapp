"use client";

import { FormEvent, useState } from "react";
import type {
  SellerPaymentProfile,
  SellerPaymentProvider,
} from "@/lib/domain/types";

type SellerPaymentProfileFormProps = {
  initialProfile: SellerPaymentProfile;
};

const providers: Array<{ value: SellerPaymentProvider; label: string }> = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "bank_transfer", label: "Transferencia bancaria" },
  { value: "cash", label: "Efectivo" },
  { value: "other", label: "Otro" },
];

export function SellerPaymentProfileForm({ initialProfile }: SellerPaymentProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      paymentProvider: String(form.get("paymentProvider") ?? "mercado_pago"),
      paymentAlias: String(form.get("paymentAlias") ?? "").trim(),
      whatsapp: String(form.get("whatsapp") ?? "").trim(),
      paymentInstructions: String(form.get("paymentInstructions") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/profile/seller-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo guardar el perfil de cobro.");
      }

      setSuccess("Perfil de cobro guardado. Los compradores lo veran al reservar.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel p-5 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">Perfil de cobro</p>
        <h2 className="mt-1 text-xl font-semibold">Recibir pagos de otros usuarios</h2>
        <p className="mt-1 text-sm text-black/70">
          Estos datos se muestran al comprador cuando reserva tu publicacion.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-black/75">
          Metodo de cobro
          <select
            name="paymentProvider"
            defaultValue={initialProfile.paymentProvider}
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          >
            {providers.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-black/75">
          Alias / CBU / link de cobro
          <input
            name="paymentAlias"
            defaultValue={initialProfile.paymentAlias ?? ""}
            placeholder="tu.alias.mp o CBU"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="text-sm text-black/75 md:col-span-2">
          WhatsApp de contacto (opcional)
          <input
            name="whatsapp"
            defaultValue={initialProfile.whatsapp ?? ""}
            placeholder="+54 11 5555 4444"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="text-sm text-black/75 md:col-span-2">
          Instrucciones de pago (opcional)
          <textarea
            name="paymentInstructions"
            defaultValue={initialProfile.paymentInstructions ?? ""}
            maxLength={280}
            className="mt-1 min-h-[90px] w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            placeholder="Ej: transferi y manda comprobante en menos de 30 min."
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar datos de cobro"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
