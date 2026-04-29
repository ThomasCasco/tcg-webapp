"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo iniciar sesión.");
      }

      router.push("/inventory");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocurrió un error. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
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

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      {error ? (
        <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
