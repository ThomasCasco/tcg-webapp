"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FulfillmentStatus, PaymentEventWithListing } from "@/lib/domain/types";
import { TransactionChat } from "@/components/transaction-chat";
import {
  fulfillmentLabelEs,
  verificationLabelEs,
} from "@/lib/shared/fulfillment-labels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Truck, Check, Scale, MessageCircle } from "@/components/ui/icon";

type Props = {
  transaction: PaymentEventWithListing;
  viewerUserId: string;
};

type Panel = "none" | "ship" | "deliver" | "dispute" | "chat";

export function TransactionCard({ transaction, viewerUserId }: Props) {
  const router = useRouter();
  const isBuyer = transaction.buyerId === viewerUserId;
  const isPaid = transaction.verificationStatus === "verified";

  const [panel, setPanel] = useState<Panel>("none");
  const [tracking, setTracking] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function updateFulfillment(status: FulfillmentStatus) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.transactionId}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingNumber: tracking.trim() || undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar.");
      setMsg({ kind: "ok", text: "Estado actualizado." });
      setPanel("none");
      setTracking("");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error." });
    } finally {
      setBusy(false);
    }
  }

  async function openDispute() {
    if (disputeReason.trim().length < 4) {
      setMsg({ kind: "err", text: "El motivo debe tener al menos 4 caracteres." });
      return;
    }
    if (disputeDetails.trim().length < 10) {
      setMsg({ kind: "err", text: "Los detalles deben tener al menos 10 caracteres." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          reason: disputeReason.trim(),
          details: disputeDetails.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo abrir disputa.");
      setMsg({ kind: "ok", text: "Disputa abierta. Revisá la sección Disputas." });
      setPanel("none");
      setDisputeReason("");
      setDisputeDetails("");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error." });
    } finally {
      setBusy(false);
    }
  }

  const verificationVariant: "success" | "warning" | "danger" =
    transaction.verificationStatus === "verified" ? "success" : "warning";

  const fulfillmentVariant: "success" | "warning" | "info" | "danger" =
    transaction.fulfillmentStatus === "delivered"
      ? "success"
      : transaction.fulfillmentStatus === "shipped"
        ? "info"
        : transaction.fulfillmentStatus === "disputed"
          ? "danger"
          : "warning";

  return (
    <Card as="article" padding="md">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-overline text-[var(--color-ink-subtle)]">
            {isBuyer ? "Compra" : "Venta"}
          </p>
          <h3 className="mt-0.5 truncate text-h3">
            {transaction.listingCardName ?? "Publicación"}
          </h3>
          {transaction.listingSetName && (
            <p className="text-caption text-[var(--color-ink-muted)]">
              {transaction.listingSetName}
            </p>
          )}
          <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
            {isBuyer ? "Vendedor: " : "Comprador: "}
            <strong>{isBuyer ? transaction.listingSellerHandle : transaction.buyerHandle}</strong>
          </p>
        </div>
      </div>

      {/* ── Status chips ── */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip variant={verificationVariant} size="sm">
          Pago: {verificationLabelEs[transaction.verificationStatus] ?? transaction.verificationStatus}
        </Chip>
        {transaction.fulfillmentStatus && (
          <Chip variant={fulfillmentVariant} size="sm">
            {fulfillmentLabelEs[transaction.fulfillmentStatus] ?? transaction.fulfillmentStatus}
          </Chip>
        )}
        {transaction.shippingTracking && (
          <Chip variant="info" size="sm">
            Tracking: {transaction.shippingTracking}
          </Chip>
        )}
      </div>

      {/* ── Inline actions (only when payment verified) ── */}
      {isPaid && (
        <div className="mt-4 flex flex-wrap gap-2">
          {!isBuyer && transaction.fulfillmentStatus !== "shipped" && transaction.fulfillmentStatus !== "delivered" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPanel(panel === "ship" ? "none" : "ship")}
              disabled={busy}
            >
              <Truck className="h-4 w-4" />
              Marcar enviado
            </Button>
          )}

          {isBuyer && transaction.fulfillmentStatus === "shipped" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => updateFulfillment("delivered")}
              disabled={busy}
              loading={busy}
            >
              <Check className="h-4 w-4" />
              Confirmar recepción
            </Button>
          )}

          {transaction.fulfillmentStatus !== "disputed" && transaction.fulfillmentStatus !== "closed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPanel(panel === "dispute" ? "none" : "dispute")}
              disabled={busy}
            >
              <Scale className="h-4 w-4" />
              Abrir disputa
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPanel(panel === "chat" ? "none" : "chat")}
            disabled={busy}
            className="ml-auto"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
        </div>
      )}

      {/* ── Ship panel ── */}
      {panel === "ship" && (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
          <FormField
            label="Número de tracking (opcional)"
            htmlFor={`tracking-${transaction.transactionId}`}
          >
            <Input
              id={`tracking-${transaction.transactionId}`}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="AR123456789"
            />
          </FormField>
          <Button
            size="sm"
            onClick={() => updateFulfillment("shipped")}
            disabled={busy}
            loading={busy}
          >
            Confirmar envío
          </Button>
        </div>
      )}

      {/* ── Dispute panel ── */}
      {panel === "dispute" && (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4">
          <FormField
            label="Motivo"
            htmlFor={`dispute-reason-${transaction.transactionId}`}
            required
          >
            <Input
              id={`dispute-reason-${transaction.transactionId}`}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="No llegó el paquete"
            />
          </FormField>
          <FormField
            label="Detalles"
            htmlFor={`dispute-details-${transaction.transactionId}`}
            hint="Mínimo 10 caracteres."
            required
          >
            <Textarea
              id={`dispute-details-${transaction.transactionId}`}
              value={disputeDetails}
              onChange={(e) => setDisputeDetails(e.target.value)}
              rows={3}
              placeholder="Pasaron 10 días desde el envío y el tracking no actualiza..."
            />
          </FormField>
          <Button
            size="sm"
            variant="danger"
            onClick={openDispute}
            disabled={busy}
            loading={busy}
          >
            Abrir disputa
          </Button>
        </div>
      )}

      {/* ── Chat panel ── */}
      {panel === "chat" && (
        <TransactionChat
          key={transaction.transactionId}
          transactionId={transaction.transactionId}
          viewerUserId={viewerUserId}
        />
      )}

      {/* ── Logistics info (collapsed) ── */}
      {(transaction.offersPickup || transaction.offersShipping || transaction.deliveryAreaNotes) && (
        <details className="mt-4 rounded-xl border border-[var(--color-border)] px-3 py-2">
          <summary className="cursor-pointer text-caption text-[var(--color-ink-muted)]">
            Detalles de entrega
          </summary>
          <div className="mt-2 space-y-1 text-caption">
            <div className="flex flex-wrap gap-2">
              {transaction.offersPickup && <Chip size="sm" variant="info">Retiro</Chip>}
              {transaction.offersShipping && <Chip size="sm" variant="info">Envío</Chip>}
            </div>
            {transaction.deliveryAreaNotes && (
              <p className="whitespace-pre-wrap text-[var(--color-ink)]">
                {transaction.deliveryAreaNotes}
              </p>
            )}
          </div>
        </details>
      )}

      {msg && (
        <p
          role={msg.kind === "err" ? "alert" : "status"}
          className={`mt-3 text-body-sm ${
            msg.kind === "ok" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}
        >
          {msg.text}
        </p>
      )}
    </Card>
  );
}
