"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Eye, EyeOff } from "@/components/ui/icon";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--radius-input)] text-[var(--color-ink-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-ink)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--radius-input)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]/40 px-3 py-2 text-[0.8125rem] text-[var(--color-danger)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
      >
        Entrar
      </Button>
      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿No tenés cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-[var(--color-accent-strong)] hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
