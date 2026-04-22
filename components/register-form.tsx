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
        setSuccess("Cuenta creada. Revisa tu email para confirmar la cuenta.");
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
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-black/70">Nombre publico</span>
        <input
          type="text"
          name="username"
          required
          minLength={3}
          placeholder="BinderBoss"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
        />
      </label>

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

      <label className="flex items-start gap-2 text-xs text-black/70">
        <input type="checkbox" required className="mt-0.5" />
        <span>
          Soy mayor de 18 anos y acepto los{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--color-accent)] underline"
          >
            Terminos y Condiciones
          </a>
          . Entiendo que la plataforma es un clasificado y NO custodia fondos.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
