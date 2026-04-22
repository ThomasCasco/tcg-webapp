"use client";

import { useState } from "react";

type Props = {
  query: string;
  label?: string;
};

export function WatchFromListingButton({ query, label = "Seguir" }: Props) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setState("saving");
    setError(null);
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        Alerta creada
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={state === "saving"}
      className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs hover:bg-white/70 disabled:opacity-60"
      title={error ?? undefined}
    >
      {state === "saving" ? "..." : label}
    </button>
  );
}
