"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { TransactionChatMessage } from "@/lib/domain/types";

type Props = {
  transactionId: string;
  viewerUserId: string;
};

export function TransactionChat({ transactionId, viewerUserId }: Props) {
  const [items, setItems] = useState<TransactionChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/transactions/${encodeURIComponent(transactionId)}/messages`,
      );
      const data = (await response.json()) as {
        error?: string;
        items?: TransactionChatMessage[];
      };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo cargar el chat.");
      }
      setItems(data.items ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 12_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [load]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/transactions/${encodeURIComponent(transactionId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmed }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo enviar.");
      }
      setText("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3">
      <p className="text-overline text-[var(--color-ink-subtle)]">
        Chat de la operación
      </p>
      <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
        Solo vos y la otra parte. Coordiná envío, retiro o comprobantes. Se actualiza solo cada
        ~12 s o al enviar.
      </p>

      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-[var(--radius-input)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-2 text-caption">
        {loading ? (
          <p className="text-[var(--color-ink-subtle)]">Cargando mensajes…</p>
        ) : items.length === 0 ? (
          <p className="text-[var(--color-ink-subtle)]">Todavía no hay mensajes. Escribí el primero.</p>
        ) : (
          items.map((m) => {
            const mine = m.senderId === viewerUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-[var(--color-ink-subtle)]">
                  {mine ? "Vos" : m.senderHandle} ·{" "}
                  {new Date(m.createdAt).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                <span
                  className={`mt-0.5 max-w-[95%] rounded-lg px-2 py-1.5 ${
                    mine
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface-elevated)] text-[var(--color-ink)] ring-1 ring-[var(--color-border-default)]"
                  }`}
                >
                  {m.body}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Escribí un mensaje…"
          className="min-w-0 flex-1 rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-white px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-[var(--radius-input)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
        >
          {sending ? "…" : "Enviar"}
        </button>
      </form>

      {error ? <p className="mt-2 text-caption text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
