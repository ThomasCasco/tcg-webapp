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
            ? `Reserva creada. Tu ID interno de operación es: ${data.transactionId} (guardalo para verificar el pago).`
            : "Reserva creada."),
      );
      setSellerPayment(data.sellerPayment ?? null);
      setReservedListing(data.listing ?? null);
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
    <div className="space-y-3">
      <ol className="list-decimal space-y-1 pl-4 text-xs text-black/65">
        <li>Tocá <strong>Reservar compra</strong> (la publicación queda en pago pendiente).</li>
        <li>Pagá al vendedor con los datos que aparecen abajo.</li>
        <li>
          En{" "}
          <Link href="/transactions" className="underline font-semibold text-[var(--color-accent-strong)]">
            Transacciones
          </Link>{" "}
          pegá el ID de pago (Mercado Pago / comprobante) para verificar.
        </li>
      </ol>
      <button
        type="button"
        onClick={reserve}
        disabled={loading}
        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Reservando..." : "Reservar compra"}
      </button>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {reservedListing ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-sky-50/90 p-3 text-xs text-black/80">
          <p className="font-semibold text-black/85">Entrega acordada en la publicación</p>
          <p className="mt-1">
            {reservedListing.offersPickup ? "· Retiro en persona " : ""}
            {reservedListing.offersShipping ? "· Envío " : ""}
          </p>
          {reservedListing.deliveryAreaNotes ? (
            <p className="mt-2 whitespace-pre-wrap">{reservedListing.deliveryAreaNotes}</p>
          ) : (
            <p className="mt-2 text-black/60">
              Coordiná el detalle con el vendedor por WhatsApp o mensaje antes de enviar dinero.
            </p>
          )}
        </div>
      ) : null}
      {sellerPayment ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[#fff6e8] p-3 text-xs text-black/75">
          <p className="font-semibold text-black/80">
            Datos de cobro de {sellerPayment.sellerHandle}
          </p>
          <p>Método: {sellerPayment.paymentProvider ?? "no informado"}</p>
          {sellerPayment.paymentAlias ? (
            <p>Alias / CBU / link: {sellerPayment.paymentAlias}</p>
          ) : null}
          {sellerPayment.whatsapp ? <p>WhatsApp: {sellerPayment.whatsapp}</p> : null}
          {sellerPayment.paymentInstructions ? (
            <p>Instrucciones: {sellerPayment.paymentInstructions}</p>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
