"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CardWatch } from "@/lib/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, X } from "@/components/ui/icon";

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
      <Card padding="md">
        <p className="text-overline text-[var(--color-ink-subtle)]">Nueva alerta</p>
        <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <FormField label="Avisame cuando alguien publique" htmlFor="query" required>
              <Input
                id="query"
                name="query"
                required
                minLength={2}
                placeholder="charizard"
              />
            </FormField>
          </div>
          <div className="w-40">
            <FormField label="Precio máx. ARS (opcional)" htmlFor="maxPriceArs">
              <Input
                id="maxPriceArs"
                name="maxPriceArs"
                type="number"
                min={1}
                placeholder="50000"
              />
            </FormField>
          </div>
          <Button type="submit" className="mb-[1px]">
            Crear alerta
          </Button>
        </form>
        {error ? (
          <p role="alert" className="mt-2 text-body-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
      </Card>

      {loading ? (
        <p className="text-body-sm text-[var(--color-ink-muted)]">Cargando...</p>
      ) : null}

      {!loading && watches.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-7 w-7" />}
          title="Sin alertas"
          description="No tenés alertas configuradas. Creá una arriba y te avisamos."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {watches.map((watch) => (
            <Card as="article" key={watch.id} padding="sm" className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{watch.query}</p>
                <p className="text-caption text-[var(--color-ink-muted)]">
                  {watch.maxPriceArs
                    ? `Solo si precio ≤ ARS ${watch.maxPriceArs.toLocaleString("es-AR")}`
                    : "Cualquier precio"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(watch.id)}
                aria-label="Eliminar alerta"
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
