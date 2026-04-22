"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function DisputeCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      transactionId: String(form.get("transactionId") ?? ""),
      reason: String(form.get("reason") ?? ""),
      details: String(form.get("details") ?? ""),
    };

    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la disputa.");
      }

      setMessage("Disputa creada correctamente.");
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel p-5 space-y-3">
      <p className="text-xs uppercase tracking-[0.12em] text-black/55">Abrir disputa</p>

      <label className="block text-sm text-black/75">
        Transaction ID
        <input
          name="transactionId"
          required
          placeholder="tx_..."
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <label className="block text-sm text-black/75">
        Motivo
        <input
          name="reason"
          required
          placeholder="Carta no coincide con la descripcion"
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <label className="block text-sm text-black/75">
        Detalles
        <textarea
          name="details"
          required
          minLength={10}
          placeholder="Describe el problema y adjunta evidencia en el siguiente paso operacional."
          className="mt-1 min-h-[120px] w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Creando..." : "Crear disputa"}
      </button>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
