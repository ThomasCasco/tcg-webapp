"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReserveListingButtonProps = {
  listingId: string;
};

export function ReserveListingButton({ listingId }: ReserveListingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reserve() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = (await response.json()) as {
        error?: string;
        transactionId?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo reservar el listing.");
      }

      setMessage(
        data.transactionId
          ? `Reservado. Transaction ID: ${data.transactionId}`
          : "Reservado correctamente.",
      );
      router.refresh();
    } catch (reserveError) {
      setError(
        reserveError instanceof Error ? reserveError.message : "Error desconocido.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={reserve}
        disabled={loading}
        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Reservando..." : "Reservar compra"}
      </button>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
