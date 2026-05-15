/**
 * POST /api/webhooks/mercadopago
 *
 * Receives Mercado Pago payment notifications (IPN / webhook).
 *
 * MP sends a POST with:
 *   - Headers: x-signature, x-request-id
 *   - Body:    { action, api_version, data: { id }, ... }
 *
 * We validate the HMAC signature, fetch the payment from MP API,
 * and update the payment_event accordingly.
 *
 * IMPORTANT: Always return 200 quickly — MP retries on non-200.
 */

import { validateMpWebhookSignature, getMpPayment } from "@/lib/server/mp-client";
import {
  getPaymentEventByExternalRef,
  recordMpWebhookEvent,
} from "@/lib/server/repository";
import { reconcileMpTransaction } from "@/lib/server/mp-reconcile";
import { sendPaymentConfirmedBuyer, sendSaleConfirmedSeller } from "@/lib/server/email";
import { createNotification } from "@/lib/server/notifications";
import { log } from "@/lib/server/logger";

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "1") / 100;

type MpWebhookBody = {
  action?: string;
  api_version?: string;
  data?: { id?: string | number };
  type?: string;
};

export async function POST(request: Request): Promise<Response> {
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";

  let body: MpWebhookBody;
  let rawBody: string;
  try {
    rawBody = await request.text();
    body = JSON.parse(rawBody) as MpWebhookBody;
  } catch {
    log.warn("MP webhook: invalid JSON body");
    await recordMpWebhookEvent({
      rawBody: "(unreadable)",
      xSignature,
      xRequestId,
      outcome: "invalid_json",
    });
    return Response.json({ ok: true });
  }

  const dataId = String(body?.data?.id ?? "");

  // Only process payment notifications
  const action = body?.action ?? "";
  const type = body?.type ?? "";
  if (type !== "payment" && action !== "payment.updated" && action !== "payment.created") {
    await recordMpWebhookEvent({
      rawBody,
      xSignature,
      xRequestId,
      mpPaymentId: dataId || null,
      outcome: "ignored",
      outcomeReason: `type=${type} action=${action}`,
    });
    return Response.json({ ok: true });
  }

  if (!dataId) {
    await recordMpWebhookEvent({
      rawBody,
      xSignature,
      xRequestId,
      outcome: "ignored",
      outcomeReason: "missing data.id",
    });
    return Response.json({ ok: true });
  }

  if (!xSignature || !xRequestId) {
    if (process.env.NODE_ENV === "production") {
      log.warn("MP webhook: missing signature headers", { dataId });
      await recordMpWebhookEvent({
        rawBody,
        xSignature,
        xRequestId,
        mpPaymentId: dataId,
        outcome: "invalid_signature",
        outcomeReason: "missing signature headers",
      });
      return Response.json({ error: "Missing signature" }, { status: 401 });
    }
    log.warn("MP webhook: missing signature headers (dev mode)", { dataId });
  } else {
    try {
      const valid = await validateMpWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
      });
      if (!valid) {
        log.warn("MP webhook: invalid signature", { dataId });
        await recordMpWebhookEvent({
          rawBody,
          xSignature,
          xRequestId,
          mpPaymentId: dataId,
          outcome: "invalid_signature",
          outcomeReason: "HMAC mismatch",
        });
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch (err) {
      // If MP_WEBHOOK_SECRET is not set, skip signature check in dev
      if (process.env.NODE_ENV === "production") {
        log.error("MP webhook: signature validation error", { error: String(err) });
        await recordMpWebhookEvent({
          rawBody,
          xSignature,
          xRequestId,
          mpPaymentId: dataId,
          outcome: "invalid_signature",
          outcomeReason: err instanceof Error ? err.message : String(err),
        });
        return Response.json({ error: "Signature error" }, { status: 500 });
      }
      log.warn("MP webhook: skipping signature check (dev mode)", { reason: String(err) });
    }
  }

  // Fetch payment details from MP
  let mpPayment: Awaited<ReturnType<typeof getMpPayment>>;
  try {
    mpPayment = await getMpPayment(dataId);
  } catch (err) {
    log.error("MP webhook: failed to fetch payment", { dataId, error: String(err) });
    await recordMpWebhookEvent({
      rawBody,
      xSignature,
      xRequestId,
      mpPaymentId: dataId,
      outcome: "fetch_failed",
      outcomeReason: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ ok: true });
  }

  const externalRef = mpPayment.externalReference;
  if (!externalRef) {
    log.warn("MP webhook: payment has no external_reference", { dataId });
    await recordMpWebhookEvent({
      rawBody,
      xSignature,
      xRequestId,
      mpPaymentId: dataId,
      outcome: "ignored",
      outcomeReason: "payment has no external_reference",
    });
    return Response.json({ ok: true });
  }

  // Reconcile via the shared module (same path used by the post-redirect fallback).
  const outcome = await reconcileMpTransaction({
    transactionId: externalRef,
    mpPaymentId: dataId,
  });

  await recordMpWebhookEvent({
    rawBody,
    xSignature,
    xRequestId,
    mpPaymentId: dataId,
    transactionId: externalRef,
    outcome: outcome.kind,
    outcomeReason: outcome.kind === "verified" ? null : outcome.reason,
  });

  if (outcome.kind === "blocked") {
    log.error("MP webhook: hard validation blocked verification", {
      dataId,
      transactionId: externalRef,
      reason: outcome.reason,
    });
    return Response.json({ ok: true });
  }

  if (outcome.kind === "not_found") {
    log.warn("MP webhook: no payment_event for external_reference", { externalRef });
    return Response.json({ ok: true });
  }

  if (outcome.kind === "still_pending") {
    log.info("MP webhook: still pending", {
      dataId,
      transactionId: externalRef,
      status: mpPayment.status,
      reason: outcome.reason,
    });
    return Response.json({ ok: true });
  }

  // verified — fire-and-forget emails (only on first verification; webhook
  // retries with already-verified payments must not re-notify).
  log.info("MP webhook: transaction verified", {
    transactionId: externalRef,
    mpPaymentId: outcome.mpPaymentId,
    wasAlreadyVerified: outcome.wasAlreadyVerified,
  });

  if (outcome.wasAlreadyVerified) {
    return Response.json({ ok: true });
  }

  const paymentEvent = await getPaymentEventByExternalRef(externalRef);
  if (paymentEvent) {
    void sendEmailsAfterPayment({
      paymentEvent,
      priceArs: mpPayment.transactionAmount,
      platformFeeArs: mpPayment.marketplaceFee,
    }).catch((err) => {
      log.error("MP webhook: email send failed", { error: String(err) });
    });
  }

  return Response.json({ ok: true });
}

async function sendEmailsAfterPayment(opts: {
  paymentEvent: {
    transactionId: string;
    listingId: string;
    buyerId?: string;
    buyerHandle: string;
  };
  priceArs: number;
  platformFeeArs: number;
}): Promise<void> {
  const { paymentEvent, priceArs, platformFeeArs } = opts;
  const { getTransactionContext } = await import("@/lib/server/transaction-context");

  const ctx = await getTransactionContext(paymentEvent.transactionId);
  if (!ctx) return;

  const netArs = Math.round(priceArs - platformFeeArs);
  const feeFallback = Math.round(priceArs * PLATFORM_FEE_PERCENT);
  const feeArs = platformFeeArs > 0 ? platformFeeArs : feeFallback;

  const linkPath = `/transactions/${ctx.transactionId}`;

  if (ctx.buyer.email) {
    await sendPaymentConfirmedBuyer({
      to: ctx.buyer.email,
      buyerName: ctx.buyer.username,
      cardName: ctx.cardName,
      priceArs,
      transactionId: ctx.transactionId,
    }).catch((err) => log.error("payment_verified buyer email failed", { error: String(err) }));
  }
  if (ctx.buyer.id) {
    await createNotification({
      userId: ctx.buyer.id,
      type: "payment_verified_buyer",
      title: "Pago confirmado",
      body: `Tu pago por ${ctx.cardName} fue acreditado. El vendedor va a coordinar la entrega.`,
      linkPath,
    });
  }

  if (ctx.seller.email) {
    await sendSaleConfirmedSeller({
      to: ctx.seller.email,
      sellerName: ctx.seller.username,
      buyerName: ctx.buyer.username,
      cardName: ctx.cardName,
      grossArs: priceArs,
      platformFeeArs: feeArs,
      netArs,
      transactionId: ctx.transactionId,
    }).catch((err) => log.error("payment_verified seller email failed", { error: String(err) }));
  }
  if (ctx.seller.id) {
    await createNotification({
      userId: ctx.seller.id,
      type: "payment_verified_seller",
      title: "Venta pagada",
      body: `${ctx.buyer.username} pagó tu publicación de ${ctx.cardName}. Coordiná la entrega.`,
      linkPath,
    });
  }
}
