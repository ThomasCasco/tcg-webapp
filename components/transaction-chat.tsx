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
    <div className="mt-4 glass-soft p-3">
      <p className="t-eyebrow">Chat de la operación</p>
      <p className="mt-1 t-xs t-soft">
        Solo vos y la otra parte. Coordiná envío, retiro o comprobantes. Se actualiza solo cada
        ~12 s o al enviar.
      </p>

      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-[var(--r-sm)] bg-black/30 p-2 text-xs">
        {loading ? (
          <p className="t-soft">Cargando mensajes…</p>
        ) : items.length === 0 ? (
          <p className="t-soft">Todavía no hay mensajes. Escribí el primero.</p>
        ) : (
          items.map((m) => {
            const mine = m.senderId === viewerUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] t-soft">
                  {mine ? "Vos" : m.senderHandle} ·{" "}
                  {new Date(m.createdAt).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                <span
                  className={`mt-0.5 max-w-[95%] rounded-2xl px-3 py-1.5 ${
                    mine
                      ? "[background:linear-gradient(180deg,var(--accent-hi),var(--accent))] text-white"
                      : "bg-[var(--glass-fill-hi)] text-[var(--ink)] ring-1 ring-[var(--glass-border)]"
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
          className="min-w-0 flex-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3 py-1.5 t-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] outline-none focus:border-[var(--accent-hi)] focus:bg-[var(--glass-fill-hi)]"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
        >
          {sending ? "…" : "Enviar"}
        </button>
      </form>

      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
