"use client";

import { FormEvent, useState } from "react";
import type {
  SellerPaymentProfile,
  SellerPaymentProvider,
} from "@/lib/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

      setSuccess("Perfil de cobro guardado. Los compradores lo verán al reservar.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="md">
      <p className="text-overline text-[var(--color-ink-subtle)]">Perfil de cobro</p>
      <h2 className="mt-1 text-h3">Recibir pagos de otros usuarios</h2>
      <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
        Estos datos se muestran al comprador cuando reserva tu publicación.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Método de cobro" htmlFor="paymentProvider">
            <Select
              id="paymentProvider"
              name="paymentProvider"
              defaultValue={initialProfile.paymentProvider}
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Alias / CBU / link de cobro" htmlFor="paymentAlias">
            <Input
              id="paymentAlias"
              name="paymentAlias"
              defaultValue={initialProfile.paymentAlias ?? ""}
              placeholder="tu.alias.mp o CBU"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="WhatsApp de contacto (opcional)" htmlFor="whatsapp">
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={initialProfile.whatsapp ?? ""}
                placeholder="+54 11 5555 4444"
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Instrucciones de pago (opcional)" htmlFor="paymentInstructions">
              <Textarea
                id="paymentInstructions"
                name="paymentInstructions"
                defaultValue={initialProfile.paymentInstructions ?? ""}
                maxLength={280}
                rows={3}
                placeholder="Ej: transferí y mandá comprobante en menos de 30 min."
              />
            </FormField>
          </div>
        </div>

        <Button type="submit" loading={loading}>
          Guardar datos de cobro
        </Button>

        {error ? (
          <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
        {success ? (
          <p role="status" className="text-body-sm text-[var(--color-success)]">{success}</p>
        ) : null}
      </form>
    </Card>
  );
}
