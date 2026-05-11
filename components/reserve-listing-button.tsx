"use client";
/**
 * ReserveListingButton — compact, used inside market listing cards.
 *
 * Tries Mercado Pago automatic checkout first.
 * If the seller hasn't connected MP (422), falls back to legacy P2P reserve flow.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "@/components/ui/icon";

type Props = {
  listingId: string;
  /**
   * Cuando true, muestra label especifica de MP automatico.
   * Cuando false/undefined, label generico para coordinacion P2P.
   */
  sellerMpConnected?: boolean;
};

type CheckoutResponse = {
  checkoutUrl?: string;
  transactionId?: string;
  error?: string;
};

type ReserveResponse = {
  error?: string;
  transactionId?: string;
  message?: string;
};

export function ReserveListingButton({ listingId, sellerMpConnected }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);

    // 1. Try MP automatic checkout
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const data = (await res.json()) as CheckoutResponse;

      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // 422 = seller has no MP connected → fallback. Other errors → show.
      if (res.status !== 422) {
        setError(data.error ?? "No se pudo iniciar el pago.");
        setBusy(false);
        return;
      }
    } catch {
      // Network error → try fallback
    }

    // 2. P2P fallback: redirect to /transactions after reserve
    try {
      const res = await fetch(`/api/listings/${listingId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as ReserveResponse;
      if (!res.ok) {
        setError(data.error ?? "No se pudo reservar.");
        setBusy(false);
        return;
      }
      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
      setBusy(false);
    }
  }

  const label = sellerMpConnected ? "Comprar con MP" : "Reservar y coordinar";

  return (
    <div>
      <Button onClick={buy} disabled={busy} loading={busy} size="sm" fullWidth>
        <ShoppingBag className="h-4 w-4" />
        {label}
      </Button>
      {!sellerMpConnected && (
        <p className="mt-1 text-[0.6875rem] text-[var(--color-ink-subtle)]">
          Pago P2P: coordinás con el vendedor.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-caption text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
