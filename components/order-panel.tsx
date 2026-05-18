"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  FulfillmentStatus,
  PaymentProvider,
  PaymentVerificationStatus,
} from "@/lib/domain/types";
import type { RatingRecord } from "@/lib/domain/reputation";
import { TransactionChat } from "@/components/transaction-chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  Truck,
  Check,
  Scale,
  MessageCircle,
  HandshakeIcon,
} from "@/components/ui/icon";

type Tx = {
  transactionId: string;
  listingId: string;
  cardName: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  verificationStatus: PaymentVerificationStatus;
  fulfillmentStatus?: FulfillmentStatus;
  shippingTracking?: string;
  buyerHandle: string;
  sellerHandle: string;
  deliveryAreaNotes?: string;
  createdAt: string;
  checkedAt: string;
  priceArs: number;
  platformFeeArs: number;
  netArs: number;
};

type Props = {
  transaction: Tx;
  viewerUserId: string;
  viewerIsBuyer: boolean;
  deliveryMode: "shipping" | "pickup";
  existingRating: RatingRecord | null;
};

function fmtArs(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OrderPanel({
  transaction,
  viewerUserId,
  viewerIsBuyer,
  deliveryMode,
  existingRating,
}: Props) {
  const router = useRouter();
  const tx = transaction;
  const isSeller = !viewerIsBuyer;
  const isPaid = tx.verificationStatus === "verified";
  const status = tx.fulfillmentStatus ?? "pending";

  const [tracking, setTracking] = useState("");
  const [stars, setStars] = useState<number>(existingRating?.stars ?? 0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [panel, setPanel] = useState<"none" | "ship" | "dispute" | "rate" | "chat">("none");

  async function patchFulfillment(nextStatus: FulfillmentStatus, trackingNumber?: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/transactions/${tx.transactionId}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, trackingNumber }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar.");
      setMsg({ kind: "ok", text: "Estado actualizado." });
      setPanel("none");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error." });
    } finally {
      setBusy(false);
    }
  }

  async function submitRating() {
    if (stars < 1) {
      setMsg({ kind: "err", text: "Elegí entre 1 y 5 estrellas." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/transactions/${tx.transactionId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment: comment.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo calificar.");
      setMsg({ kind: "ok", text: "¡Gracias por tu calificación!" });
      setPanel("none");
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
          transactionId: tx.transactionId,
          reason: disputeReason.trim(),
          details: disputeDetails.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo abrir la disputa.");
      setMsg({ kind: "ok", text: "Disputa abierta. La otra parte recibió aviso." });
      setPanel("none");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Timeline status={status} isPaid={isPaid} deliveryMode={deliveryMode} />

      <Card padding="md" className="space-y-3">
        <p className="t-eyebrow">Montos</p>
        <dl className="grid grid-cols-2 gap-y-1.5 t-sm">
          <dt className="t-mute">Precio bruto</dt>
          <dd className="text-right">{fmtArs(tx.priceArs)}</dd>
          <dt className="t-mute">Comisión plataforma</dt>
          <dd className="text-right">−{fmtArs(tx.platformFeeArs)}</dd>
          <dt className="font-semibold">{isSeller ? "Tu ingreso neto" : "Total que pagaste"}</dt>
          <dd className="text-right font-semibold">
            {fmtArs(isSeller ? tx.netArs : tx.priceArs)}
          </dd>
        </dl>
        <div className="flex flex-wrap gap-2 pt-1 t-xs t-mute">
          {tx.provider === "mercado_pago" ? <Chip size="sm" variant="info">Mercado Pago</Chip> : <Chip size="sm">P2P</Chip>}
          {tx.providerPaymentId ? (
            <Chip size="sm">MP ID: {tx.providerPaymentId}</Chip>
          ) : null}
          <Chip size="sm" variant={isPaid ? "success" : "warning"}>
            {isPaid ? "Pago verificado" : "Pago pendiente"}
          </Chip>
        </div>
      </Card>

      {/* Acción principal por estado/rol/modo */}
      {isPaid && status !== "closed" && status !== "disputed" && (
        <Card padding="md" className="space-y-3">
          <p className="t-eyebrow">Siguiente paso</p>

          {status === "seller_confirmed" || status === "pending" ? (
            isSeller ? (
              deliveryMode === "pickup" ? (
                <>
                  <p className="t-sm">
                    Coordiná retiro por chat con <strong>{tx.buyerHandle}</strong>.
                    Cuando entregues la carta en persona, marcala como entregada.
                  </p>
                  <Button
                    size="md"
                    onClick={() => patchFulfillment("delivered")}
                    disabled={busy}
                    loading={busy}
                  >
                    <HandshakeIcon className="h-4 w-4" />
                    Marcar entregada en persona
                  </Button>
                </>
              ) : (
                <>
                  <p className="t-sm">
                    Enviá la carta y cargá el <strong>número de tracking</strong> para
                    marcar el envío.
                  </p>
                  {panel === "ship" ? (
                    <div className="space-y-3">
                      <FormField
                        label="Número de tracking"
                        htmlFor={`tracking-${tx.transactionId}`}
                        hint="Correo Argentino, Andreani, OCA, etc. Mínimo 4 caracteres."
                        required
                      >
                        <Input
                          id={`tracking-${tx.transactionId}`}
                          value={tracking}
                          onChange={(e) => setTracking(e.target.value)}
                          placeholder="AR123456789"
                        />
                      </FormField>
                      <div className="flex gap-2">
                        <Button
                          size="md"
                          onClick={() => patchFulfillment("shipped", tracking.trim())}
                          disabled={busy || tracking.trim().length < 4}
                          loading={busy}
                        >
                          Confirmar envío
                        </Button>
                        <Button size="md" variant="ghost" onClick={() => setPanel("none")} disabled={busy}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="md" onClick={() => setPanel("ship")}>
                      <Truck className="h-4 w-4" />
                      Marcar enviado
                    </Button>
                  )}
                </>
              )
            ) : (
              <p className="t-sm t-mute">
                Esperando al vendedor.{" "}
                {deliveryMode === "pickup"
                  ? "Coordinen el retiro por el chat."
                  : "Te avisamos cuando despache el envío."}
              </p>
            )
          ) : status === "shipped" ? (
            viewerIsBuyer ? (
              <>
                <p className="t-sm">
                  El vendedor marcó el envío
                  {tx.shippingTracking ? <> con tracking <code className="t-mono">{tx.shippingTracking}</code></> : null}.
                  Cuando recibas la carta, confirmá la recepción.
                </p>
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => patchFulfillment("delivered")}
                  disabled={busy}
                  loading={busy}
                >
                  <Check className="h-4 w-4" />
                  Confirmar recepción
                </Button>
              </>
            ) : (
              <p className="t-sm t-mute">
                Esperando que el comprador confirme la recepción.
                {tx.shippingTracking ? <> Tracking: <code className="t-mono">{tx.shippingTracking}</code></> : null}
              </p>
            )
          ) : status === "delivered" ? (
            viewerIsBuyer && !existingRating ? (
              panel === "rate" ? (
                <RatingPanel
                  stars={stars}
                  hoverStars={hoverStars}
                  comment={comment}
                  busy={busy}
                  onSetStars={setStars}
                  onHoverStars={setHoverStars}
                  onComment={setComment}
                  onSubmit={submitRating}
                  onCancel={() => setPanel("none")}
                />
              ) : (
                <>
                  <p className="t-sm">
                    ¿Cómo fue tu experiencia con <strong>{tx.sellerHandle}</strong>?
                    Calificarlo cierra la operación y suma a su reputación pública.
                  </p>
                  <Button size="md" onClick={() => setPanel("rate")}>
                    Calificar al vendedor
                  </Button>
                </>
              )
            ) : viewerIsBuyer && existingRating ? (
              <p className="t-sm t-mute">
                Ya calificaste con {"★".repeat(existingRating.stars)}. Esperamos a que el
                sistema cierre la operación en segundos.
              </p>
            ) : (
              <p className="t-sm t-mute">
                Entrega confirmada. Esperando calificación del comprador para cerrar.
              </p>
            )
          ) : null}
        </Card>
      )}

      {status === "disputed" && (
        <Card padding="md" className="chip-danger space-y-2">
          <p className="font-semibold">Operación en disputa</p>
          <p className="t-sm">
            Coordinen por el chat. Si no llegan a acuerdo, el equipo de moderación
            interviene.
          </p>
        </Card>
      )}

      {status === "closed" && (
        <Card padding="md" className="chip-success space-y-2">
          <p className="font-semibold">Operación cerrada</p>
          <p className="t-sm">
            Esta operación quedó finalizada
            {existingRating ? <> con una calificación de {"★".repeat(existingRating.stars)} para {tx.sellerHandle}</> : null}.
          </p>
        </Card>
      )}

      {/* Acciones secundarias */}
      {isPaid && status !== "closed" && status !== "disputed" && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPanel(panel === "chat" ? "none" : "chat")}
            disabled={busy}
          >
            <MessageCircle className="h-4 w-4" />
            Chat con {viewerIsBuyer ? "el vendedor" : "el comprador"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPanel(panel === "dispute" ? "none" : "dispute")}
            disabled={busy}
            className="ml-auto"
          >
            <Scale className="h-4 w-4" />
            Abrir disputa
          </Button>
        </div>
      )}

      {panel === "chat" && (
        <Card padding="md">
          <TransactionChat
            transactionId={tx.transactionId}
            viewerUserId={viewerUserId}
          />
        </Card>
      )}

      {panel === "dispute" && (
        <Card padding="md" className="space-y-3 border-[var(--color-danger)]/30">
          <FormField
            label="Motivo"
            htmlFor={`dispute-reason-${tx.transactionId}`}
            required
          >
            <Input
              id={`dispute-reason-${tx.transactionId}`}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="No llegó el paquete"
            />
          </FormField>
          <FormField
            label="Detalles"
            htmlFor={`dispute-details-${tx.transactionId}`}
            hint="Mínimo 10 caracteres."
            required
          >
            <Textarea
              id={`dispute-details-${tx.transactionId}`}
              value={disputeDetails}
              onChange={(e) => setDisputeDetails(e.target.value)}
              rows={3}
              placeholder="Pasaron 10 días desde el envío y el tracking no actualiza..."
            />
          </FormField>
          <div className="flex gap-2">
            <Button size="md" variant="danger" onClick={openDispute} disabled={busy} loading={busy}>
              Abrir disputa
            </Button>
            <Button size="md" variant="ghost" onClick={() => setPanel("none")} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Metadatos de entrega */}
      {(tx.deliveryAreaNotes) && (
        <Card padding="md" className="space-y-2">
          <p className="t-eyebrow">Detalles de entrega</p>
          <p className="t-sm whitespace-pre-wrap text-[var(--ink)]">{tx.deliveryAreaNotes}</p>
        </Card>
      )}

      <Card padding="md" className="space-y-1 t-xs t-mute">
        <p>Operación creada: {fmtDate(tx.createdAt)}</p>
        <p>Última actualización: {fmtDate(tx.checkedAt)}</p>
      </Card>

      {msg && (
        <p
          role={msg.kind === "err" ? "alert" : "status"}
          className={`text-body-sm ${
            msg.kind === "ok" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}
        >
          {msg.text}
        </p>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Timeline
// ────────────────────────────────────────────────────────────────────────────

function Timeline({
  status,
  isPaid,
  deliveryMode,
}: {
  status: FulfillmentStatus;
  isPaid: boolean;
  deliveryMode: "shipping" | "pickup";
}) {
  const steps =
    deliveryMode === "pickup"
      ? [
          { key: "paid", label: "Pago" },
          { key: "delivered", label: "Entrega en persona" },
          { key: "closed", label: "Cerrada" },
        ]
      : [
          { key: "paid", label: "Pago" },
          { key: "shipped", label: "Enviada" },
          { key: "delivered", label: "Recibida" },
          { key: "closed", label: "Cerrada" },
        ];

  const reached = new Set<string>();
  if (isPaid) reached.add("paid");
  if (["shipped", "delivered", "closed"].includes(status)) reached.add("shipped");
  if (["delivered", "closed"].includes(status)) reached.add("delivered");
  if (status === "closed") reached.add("closed");

  return (
    <Card padding="md" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-3">
        {steps.map((step, i) => {
          const done = reached.has(step.key);
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    done
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-2)] text-[var(--ink-soft)] ring-1 ring-[var(--glass-border)]"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`t-sm ${done ? "text-[var(--ink)]" : "t-mute"}`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <span
                  aria-hidden
                  className={`h-px w-8 ${done ? "bg-[var(--accent)]" : "bg-[var(--glass-border)]"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Rating panel
// ────────────────────────────────────────────────────────────────────────────

function RatingPanel(props: {
  stars: number;
  hoverStars: number;
  comment: string;
  busy: boolean;
  onSetStars: (n: number) => void;
  onHoverStars: (n: number) => void;
  onComment: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const display = props.hoverStars || props.stars;
  return (
    <div className="space-y-3">
      <div>
        <p className="t-sm font-semibold">¿Cómo estuvo la operación?</p>
        <div
          className="mt-2 flex gap-1"
          onMouseLeave={() => props.onHoverStars(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrellas`}
              onMouseEnter={() => props.onHoverStars(n)}
              onClick={() => props.onSetStars(n)}
              className={`text-3xl transition-colors ${
                n <= display ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <FormField
        label="Comentario (opcional)"
        htmlFor="rating-comment"
        hint="Hasta 600 caracteres."
      >
        <Textarea
          id="rating-comment"
          value={props.comment}
          onChange={(e) => props.onComment(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="Excelente vendedor, envío rápido y carta tal cual la foto."
        />
      </FormField>
      <div className="flex gap-2">
        <Button size="md" onClick={props.onSubmit} disabled={props.busy || props.stars < 1} loading={props.busy}>
          Enviar calificación
        </Button>
        <Button size="md" variant="ghost" onClick={props.onCancel} disabled={props.busy}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
