"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CardWatch } from "@/lib/domain/types";

export function WatchlistManager() {
  const [watches, setWatches] = useState<CardWatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/watchlist");
      const data = (await response.json()) as { items?: CardWatch[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load");
      setWatches(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      query: String(form.get("query") ?? ""),
      maxPriceArs: Number(form.get("maxPriceArs") ?? 0) || undefined,
    };

    setError(null);
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function remove(id: string) {
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="surface-panel flex flex-wrap items-end gap-3 p-4"
      >
        <label className="flex-1 text-sm text-black/75">
          Avisame cuando alguien publique
          <input
            name="query"
            required
            minLength={2}
            placeholder="charizard"
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="text-sm text-black/75">
          Precio maximo ARS (opcional)
          <input
            name="maxPriceArs"
            type="number"
            min={1}
            placeholder="50000"
            className="mt-1 w-40 rounded-xl border border-[var(--color-border)] bg-white/75 px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
        >
          Crear alerta
        </button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/60">Cargando...</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {watches.map((watch) => (
          <article
            key={watch.id}
            className="surface-panel flex items-center justify-between p-4"
          >
            <div>
              <p className="font-semibold">{watch.query}</p>
              <p className="text-xs text-black/60">
                {watch.maxPriceArs
                  ? `Solo si precio <= ARS ${watch.maxPriceArs.toLocaleString("es-AR")}`
                  : "Cualquier precio"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(watch.id)}
              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs hover:bg-white"
            >
              Eliminar
            </button>
          </article>
        ))}
        {watches.length === 0 && !loading ? (
          <p className="text-sm text-black/60">
            No tenes alertas configuradas. Creá una arriba y te avisamos.
          </p>
        ) : null}
      </div>
    </div>
  );
}
