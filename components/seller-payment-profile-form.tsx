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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Info,
  MessageCircle,
  Wallet,
} from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

type SellerPaymentProfileFormProps = {
  initialProfile: SellerPaymentProfile;
};

const providers: Array<{
  value: SellerPaymentProvider;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "mercado_pago", label: "Mercado Pago", hint: "Recomendado", icon: Wallet },
  { value: "bank_transfer", label: "Transferencia", hint: "CBU / CVU / Alias", icon: CreditCard },
  { value: "cash", label: "Efectivo", hint: "En persona", icon: Wallet },
  { value: "other", label: "Otro", hint: "Detallá abajo", icon: Info },
];

export function SellerPaymentProfileForm({ initialProfile }: SellerPaymentProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [provider, setProvider] = useState<SellerPaymentProvider>(
    initialProfile.paymentProvider,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      paymentProvider: provider,
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
    <Card padding="lg">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-white">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="t-eyebrow">Perfil de cobro</p>
          <h2 className="mt-1 t-h3">Recibir pagos de otros usuarios</h2>
          <p className="mt-1 t-sm t-mute">
            Estos datos se muestran al comprador cuando reserva tu publicación.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="space-y-3">
          <h3 className="t-sm font-bold text-[var(--ink)]">Método preferido</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {providers.map(({ value, label, hint, icon: Icon }) => {
              const active = provider === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setProvider(value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-[var(--r-sm)] border p-3 text-left transition-colors",
                    active
                      ? "border-[var(--accent)] bg-[var(--color-accent-soft)]"
                      : "border-[var(--glass-border)] bg-white/[0.02] hover:border-[var(--glass-border-hi)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-sm)]",
                      active ? "bg-[var(--accent)] text-white" : "bg-white/5 t-mute",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="t-sm font-semibold text-[var(--ink)]">{label}</span>
                    <span className="t-xs t-mute">{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-[var(--hairline)]" />

        <section className="space-y-3">
          <h3 className="t-sm font-bold text-[var(--ink)]">Datos de contacto</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Alias / CBU / link de cobro" htmlFor="paymentAlias">
              <Input
                id="paymentAlias"
                name="paymentAlias"
                defaultValue={initialProfile.paymentAlias ?? ""}
                placeholder="tu.alias.mp o CBU"
              />
            </FormField>

            <FormField label="WhatsApp (opcional)" htmlFor="whatsapp">
              <div className="relative">
                <MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 t-soft" />
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={initialProfile.whatsapp ?? ""}
                  placeholder="+54 11 5555 4444"
                  className="pl-9"
                />
              </div>
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Instrucciones de pago (opcional)"
                htmlFor="paymentInstructions"
                hint="Máx 280 caracteres"
              >
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
        </section>

        <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            {error && (
              <p role="alert" className="inline-flex items-center gap-1.5 t-sm font-medium text-[var(--bad)]">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="inline-flex items-center gap-1.5 t-sm font-medium text-[var(--ok)]">
                <CheckCircle className="h-4 w-4" />
                {success}
              </p>
            )}
            {!error && !success && (
              <p className="t-xs t-soft">Los compradores verán esta info al reservar tu publicación.</p>
            )}
          </div>
          <Button type="submit" loading={loading} size="md">
            Guardar datos de cobro
          </Button>
        </div>
      </form>
    </Card>
  );
}
