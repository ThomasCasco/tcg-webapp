"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormSection, FormRow } from "@/components/ui/form-section";

export function RegisterForm() {
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
    const payload = {
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        requiresEmailConfirmation?: boolean;
      };
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear la cuenta.");
      if (data.requiresEmailConfirmation) {
        setSuccess("Cuenta creada. Revisá tu email para confirmar.");
      } else {
        router.push("/inventory");
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Tu cuenta">
        <FormRow label="Usuario" htmlFor="username" required>
          <Input
            id="username"
            name="username"
            variant="ghost"
            required
            minLength={3}
            maxLength={24}
            placeholder="BinderBoss"
          />
        </FormRow>
        <FormRow label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            name="email"
            variant="ghost"
            autoComplete="email"
            required
            placeholder="tu@email.com"
          />
        </FormRow>
        <FormRow label="Contraseña" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            name="password"
            variant="ghost"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Mín. 8 caracteres"
          />
        </FormRow>
      </FormSection>

      <FormSection
        title="Términos"
        hint="La plataforma es un clasificado y NO custodia fondos."
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-[0.875rem] leading-snug text-[var(--color-ink-muted)]">
            Soy mayor de 18 años y acepto los{" "}
            <Link href="/terms" target="_blank" rel="noreferrer" className="font-medium text-[var(--color-accent-strong)] underline underline-offset-2">
              Términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" target="_blank" rel="noreferrer" className="font-medium text-[var(--color-accent-strong)] underline underline-offset-2">
              Privacidad
            </Link>
          </span>
          <Switch id="terms" name="terms" required />
        </div>
      </FormSection>

      {error && (
        <p role="alert" className="text-center text-[0.8125rem] text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-center text-[0.8125rem] text-[var(--color-success)]">
          {success}
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        className="rounded-full"
      >
        Crear cuenta
      </Button>

      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-[var(--color-accent-strong)] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
