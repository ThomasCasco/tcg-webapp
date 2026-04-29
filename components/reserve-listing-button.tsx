"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing, SellerPaymentDetails } from "@/lib/domain/types";

type ReserveListingButtonProps = {
  listingId: string;
};

export function ReserveListingButton({ listingId }: ReserveListingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sellerPayment, setSellerPayment] = useState<SellerPaymentDetails | null>(null);
  const [reservedListing, setReservedListing] = useState<Listing | null>(null);

  async function reserve() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setSellerPayment(null);
    setReservedListing(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = (await response.json()) as {
        error?: string;
        transactionId?: string;
        message?: string;
        sellerPayment?: SellerPaymentDetails;
        listing?: Listing;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo reservar la publicación.");
      }

      setMessage(
        data.message ??
          (data.transactionId
            ? `Reserva creada. Guardá tu ID de operación: ${data.transactionId}.`
            : "Reserva creada."),
      );
      setSellerPayment(data.sellerPayment ?? null);
      setReservedListing(data.listing ?? null);
      router.refresh();
    } catch (reserveError) {
      setError(
        reserveError instanceof Error ? reserveError.message : "No se pudo completar la reserva.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={reserve}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Reservando..." : "Reservar compra"}
      </button>
      {message ? (
        <div className="rounded-lg bg-[var(--color-success-soft)] px-3 py-2 text-xs text-[var(--color-success)]">
          {message}
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Después del pago, cargá el comprobante desde{" "}
            <Link href="/transactions" className="font-semibold text-[var(--color-accent)] underline">
              Operaciones
            </Link>
            .
          </p>
        </div>
      ) : null}
      {reservedListing ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-info-soft)] p-3 text-xs">
          <p className="font-semibold">Entrega acordada</p>
          <p className="mt-1">
            {reservedListing.offersPickup ? "Retiro en persona" : ""}
            {reservedListing.offersPickup && reservedListing.offersShipping ? " · " : ""}
            {reservedListing.offersShipping ? "Envío" : ""}
          </p>
          {reservedListing.deliveryAreaNotes ? (
            <p className="mt-2 whitespace-pre-wrap muted">{reservedListing.deliveryAreaNotes}</p>
          ) : (
            <p className="mt-2 subtle">
              Coordiná el detalle con el vendedor antes de transferir.
            </p>
          )}
        </div>
      ) : null}
      {sellerPayment ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-warning-soft)] p-3 text-xs">
          <p className="font-semibold">
            Datos de cobro de {sellerPayment.sellerHandle}
          </p>
          <dl className="mt-1 space-y-0.5">
            {sellerPayment.paymentProvider ? (
              <div className="flex gap-2">
                <dt className="subtle">Método:</dt>
                <dd className="font-medium">{sellerPayment.paymentProvider}</dd>
              </div>
            ) : null}
            {sellerPayment.paymentAlias ? (
              <div className="flex gap-2">
                <dt className="subtle">Alias/CBU:</dt>
                <dd className="font-medium">{sellerPayment.paymentAlias}</dd>
              </div>
            ) : null}
            {sellerPayment.whatsapp ? (
              <div className="flex gap-2">
                <dt className="subtle">WhatsApp:</dt>
                <dd className="font-medium">{sellerPayment.whatsapp}</dd>
              </div>
            ) : null}
            {sellerPayment.paymentInstructions ? (
              <div className="mt-1">
                <dt className="subtle">Instrucciones:</dt>
                <dd className="mt-0.5">{sellerPayment.paymentInstructions}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
