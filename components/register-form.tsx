"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la cuenta.");
      }

      if (data.requiresEmailConfirmation) {
        setSuccess("Cuenta creada. Revisá tu email para confirmarla.");
      } else {
        router.push("/inventory");
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocurrió un error. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Nombre público</span>
        <input
          type="text"
          name="username"
          required
          minLength={3}
          placeholder="Ej: binderboss"
          className="input"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          placeholder="tu@email.com"
          className="input"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="input"
        />
      </label>

      <label className="flex items-start gap-2 text-xs muted">
        <input type="checkbox" required className="mt-0.5" />
        <span>
          Soy mayor de 18 años y acepto los{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--color-accent)] underline"
          >
            Términos y Condiciones
          </a>
          .
        </span>
      </label>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      {error ? (
        <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">
          {success}
        </p>
      ) : null}
    </form>
  );
}
