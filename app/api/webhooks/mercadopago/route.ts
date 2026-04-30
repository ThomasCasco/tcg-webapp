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
  verifyTransaction,
  setPaymentMpPaymentId,
  getUserProfile,
} from "@/lib/server/repository";
import { sendPaymentConfirmedBuyer, sendSaleConfirmedSeller } from "@/lib/server/email";
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
    // Bad JSON — return 200 so MP doesn't retry endlessly
    log.warn("MP webhook: invalid JSON body");
    return Response.json({ ok: true });
  }

  const dataId = String(body?.data?.id ?? "");

  // Only process payment notifications
  const action = body?.action ?? "";
  const type = body?.type ?? "";
  if (type !== "payment" && action !== "payment.updated" && action !== "payment.created") {
    return Response.json({ ok: true });
  }

  if (!dataId) {
    return Response.json({ ok: true });
  }

  // Validate HMAC signature
  if (xSignature) {
    try {
      const valid = await validateMpWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
      });
      if (!valid) {
        log.warn("MP webhook: invalid signature", { dataId });
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch (err) {
      // If MP_WEBHOOK_SECRET is not set, skip signature check in dev
      if (process.env.NODE_ENV === "production") {
        log.error("MP webhook: signature validation error", { error: String(err) });
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
    // Return 200 — we don't want MP to hammer us for transient errors
    return Response.json({ ok: true });
  }

  const externalRef = mpPayment.externalReference;
  if (!externalRef) {
    log.warn("MP webhook: payment has no external_reference", { dataId });
    return Response.json({ ok: true });
  }

  // Find the payment_event by external_reference (= transactionId)
  let paymentEvent: Awaited<ReturnType<typeof getPaymentEventByExternalRef>>;
  try {
    paymentEvent = await getPaymentEventByExternalRef(externalRef);
  } catch (err) {
    log.error("MP webhook: DB lookup failed", { externalRef, error: String(err) });
    return Response.json({ ok: true });
  }

  if (!paymentEvent) {
    log.warn("MP webhook: no payment_event for external_reference", { externalRef });
    return Response.json({ ok: true });
  }

  // Stamp mp_payment_id (idempotent)
  try {
    await setPaymentMpPaymentId({
      transactionId: paymentEvent.transactionId,
      mpPaymentId: dataId,
    });
  } catch (err) {
    log.error("MP webhook: setPaymentMpPaymentId failed", { error: String(err) });
  }

  // Only proceed if payment is approved
  const approved = ["approved", "accredited"].includes(mpPayment.status.toLowerCase());
  if (!approved) {
    log.info("MP webhook: payment not approved", {
      dataId,
      status: mpPayment.status,
      externalRef,
    });
    return Response.json({ ok: true });
  }

  // Verify transaction (bypasses buyer ownership check — this is a server-side call)
  let verified: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    verified = await verifyTransaction({
      transactionId: paymentEvent.transactionId,
      bypassOwnership: true,
      provider: "mercado_pago",
      providerPaymentId: dataId,
      providerStatus: mpPayment.status,
    });
  } catch (err) {
    log.error("MP webhook: verifyTransaction failed", {
      transactionId: paymentEvent.transactionId,
      error: String(err),
    });
    return Response.json({ ok: true });
  }

  log.info("MP webhook: transaction verified", {
    transactionId: paymentEvent.transactionId,
    verificationStatus: verified.payment.verificationStatus,
  });

  // Send email notifications (fire-and-forget, don't fail the webhook)
  void sendEmailsAfterPayment({
    paymentEvent: verified.payment,
    priceArs: mpPayment.transactionAmount,
    platformFeeArs: mpPayment.marketplaceFee,
  }).catch((err) => {
    log.error("MP webhook: email send failed", { error: String(err) });
  });

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

  // We need buyer and seller profile data.
  // The listing row holds seller_id; we'll need to fetch it.
  // Use the repository getUserProfile helper for both parties.

  const buyerId = paymentEvent.buyerId;
  if (!buyerId) return;

  const [buyerProfile, listingRow] = await Promise.all([
    getUserProfile(buyerId),
    // Fetch seller_id from payment_event → listing
    (async () => {
      const { getSupabaseAdminClient } = await import("@/lib/server/supabase");
      const client = getSupabaseAdminClient();
      const { data } = await client
        .from("market_listings")
        .select("seller_id, card_name")
        .eq("id", paymentEvent.listingId)
        .maybeSingle();
      return data as { seller_id: string | null; card_name: string } | null;
    })(),
  ]);

  const cardName = listingRow?.card_name ?? "Carta";
  const sellerId = listingRow?.seller_id;

  const netArs = Math.round(priceArs - platformFeeArs);
  const feeFallback = Math.round(priceArs * PLATFORM_FEE_PERCENT);
  const feeArs = platformFeeArs > 0 ? platformFeeArs : feeFallback;

  // Buyer email
  if (buyerProfile?.email) {
    await sendPaymentConfirmedBuyer({
      to: buyerProfile.email,
      buyerName: buyerProfile.username,
      cardName,
      priceArs,
      transactionId: paymentEvent.transactionId,
    });
  }

  // Seller email
  if (sellerId) {
    const sellerProfile = await getUserProfile(sellerId);
    if (sellerProfile?.email) {
      await sendSaleConfirmedSeller({
        to: sellerProfile.email,
        sellerName: sellerProfile.username,
        buyerName: buyerProfile?.username ?? paymentEvent.buyerHandle,
        cardName,
        grossArs: priceArs,
        platformFeeArs: feeArs,
        netArs,
        transactionId: paymentEvent.transactionId,
      });
    }
  }
}
