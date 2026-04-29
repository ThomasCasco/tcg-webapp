"use client";

import { useState } from "react";

type Props = {
  query: string;
  label?: string;
};

export function WatchFromListingButton({ query, label = "Seguir" }: Props) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
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
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear la alerta.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setState("error");
    }
  }

  if (state === "done") {
    return <span className="chip chip-success">Alerta creada</span>;
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={state === "saving"}
      className="btn btn-ghost btn-sm"
      title={error ?? undefined}
    >
      {state === "saving" ? "..." : `☆ ${label}`}
    </button>
  );
}
