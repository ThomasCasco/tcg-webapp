"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, FormRow } from "@/components/ui/form-section";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar sesión.");
      router.push("/inventory");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection>
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
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </FormRow>
      </FormSection>

      {error && (
        <p role="alert" className="text-center text-[0.8125rem] text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        className="rounded-full"
      >
        Entrar
      </Button>

      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-[var(--color-accent-strong)] hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
