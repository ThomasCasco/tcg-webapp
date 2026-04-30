"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

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
      setError(submitError instanceof Error ? submitError.message : "Ocurrió un error. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
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
          placeholder="tu@email.com"
        />
      </FormField>
      <FormField label="Contraseña" htmlFor="password" required>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </FormField>
      {error && (
        <p role="alert" className="text-[0.8125rem] text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Button type="submit" loading={loading} fullWidth size="lg">
        Entrar
      </Button>
      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-[var(--color-accent-strong)] hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
