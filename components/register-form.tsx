"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField
        label="Nombre público"
        htmlFor="username"
        required
        hint="Lo verán otros vendedores y compradores."
      >
        <Input
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={24}
          placeholder="BinderBoss"
        />
      </FormField>
      <FormField label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
        />
      </FormField>
      <FormField label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres.">
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </FormField>
      <label className="flex items-start gap-2 text-[0.875rem] text-[var(--color-ink-muted)]">
        <input
          type="checkbox"
          required
          name="terms"
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span>
          Soy mayor de 18 años y acepto los{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent-strong)] underline"
          >
            Términos y Condiciones
          </Link>
          . Entiendo que la plataforma es un clasificado y NO custodia fondos.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-[0.8125rem] text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-[0.8125rem] text-[var(--color-success)]">
          {success}
        </p>
      )}
      <Button type="submit" loading={loading} fullWidth size="lg">
        Crear cuenta
      </Button>
      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[var(--color-accent-strong)] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
