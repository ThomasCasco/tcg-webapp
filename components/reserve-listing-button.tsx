"use client";
/**
 * ReserveListingButton — starts the Mercado Pago checkout for a listing.
 *
 * Every purchase goes through MP (the seller's own account), so payment is
 * verified automatically. There is no alias/CBU fallback.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "@/components/ui/icon";

type Props = {
  listingId: string;
  size?: "sm" | "md" | "lg";
};

type CheckoutResponse = {
  checkoutUrl?: string;
  transactionId?: string;
  error?: string;
};

function friendlyError(status: number, message?: string): string {
  if (status === 409) return "Alguien la está comprando ahora mismo. Probá de nuevo en un rato.";
  if (status === 422) return "Este vendedor todavía no puede cobrar por Mercado Pago.";
  if (status === 429) return "Demasiados intentos seguidos. Esperá un minuto y volvé a probar.";
  return message && /[áéíóúñ¿]/i.test(message)
    ? message
    : "No pudimos abrir el pago. Probá de nuevo en unos segundos.";
}

export function ReserveListingButton({ listingId, size = "md" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
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
      setError(friendlyError(res.status, data.error));
    } catch {
      setError("Sin conexión. Revisá tu internet y probá de nuevo.");
    }
    setBusy(false);
  }

  return (
    <div>
      <Button onClick={buy} disabled={busy} loading={busy} size={size} fullWidth>
        <ShoppingBag className="h-4 w-4" />
        Comprar con Mercado Pago
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-caption text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
