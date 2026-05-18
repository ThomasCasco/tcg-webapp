"use client";

import { FormEvent, InvalidEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowLeft, MailCheck } from "@/components/ui/icon";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo enviar el email.");
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  function onInvalid(event: InvalidEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (input.validity.valueMissing) {
      input.setCustomValidity("Ingresá tu email.");
    } else if (input.validity.typeMismatch) {
      input.setCustomValidity("Ingresá un email válido.");
    } else {
      input.setCustomValidity("Revisá este campo.");
    }
  }

  function clearValidity(event: FormEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--ok)]/30 bg-[var(--color-success-soft)] px-3 py-2 t-sm text-[var(--ok)]"
        >
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Si el email corresponde a una cuenta, te mandamos un link para cambiar la contraseña.
          </span>
        </div>
        <Button asChild fullWidth variant="secondary">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          onInvalid={onInvalid}
          onInput={clearValidity}
          placeholder="tu@email.com"
        />
      </FormField>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--bad)]/30 bg-[var(--color-danger-soft)] px-3 py-2 t-sm text-[var(--bad)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button type="submit" loading={loading} fullWidth size="lg">
        Enviar link
      </Button>
      <p className="text-center t-sm t-mute">
        ¿Te acordaste?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent-hi)] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
