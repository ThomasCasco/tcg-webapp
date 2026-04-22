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
        throw new Error(data.error ?? "No se pudo iniciar sesion.");
      }

      router.push("/inventory");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-black/70">Email</span>
        <input
          type="email"
          name="email"
          required
          placeholder="tu@email.com"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-black/70">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="********"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
