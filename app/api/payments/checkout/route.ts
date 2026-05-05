/**
 * POST /api/payments/checkout
 *
 * Creates a Mercado Pago checkout preference for a listing.
 * The buyer is redirected to MP's checkout page.
 *
 * Body: { listingId: string }
 *
 * Returns: { checkoutUrl: string; transactionId: string }
 */

import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getListingById,
  reserveListing,
  updatePaymentMpCheckout,
  getUserProfile,
  releasePendingCheckoutReservation,
} from "@/lib/server/repository";
import { getValidAccessToken } from "@/lib/server/mp-auth";
import { createMpPreference } from "@/lib/server/mp-client";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";
import { log } from "@/lib/server/logger";

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "1") / 100;

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`checkout:${user.id}:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let listingId: string;
  try {
    const body = await request.json() as { listingId?: unknown };
    listingId = String(body.listingId ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!listingId) {
    return Response.json({ error: "listingId is required." }, { status: 400 });
  }

  let pendingReservation: { listingId: string; transactionId: string } | null = null;

  try {
    // 1. Validate listing exists and is purchasable
    const listing = await getListingById(listingId);
    if (!listing) {
      return Response.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.status !== "active") {
      return Response.json({ error: "Listing is not available." }, { status: 409 });
    }
    if (listing.sellerId === user.id) {
      return Response.json({ error: "Cannot purchase your own listing." }, { status: 409 });
    }
    if (!listing.sellerId) {
      return Response.json({ error: "Listing has no seller." }, { status: 409 });
    }

    // 2. Get seller's valid MP access token
    let sellerAccessToken: string;
    try {
      sellerAccessToken = await getValidAccessToken(listing.sellerId);
    } catch {
      return Response.json(
        { error: "El vendedor no tiene Mercado Pago conectado. Contactalo directamente." },
        { status: 422 },
      );
    }

    // 3. Reserve listing + create payment_event
    const reservation = await reserveListing({
      listingId,
      buyerId: user.id,
      buyerHandle: user.username,
    });
    pendingReservation = { listingId, transactionId: reservation.transactionId };

    // 4. Compute platform fee (rounded to nearest ARS peso)
    const priceArs = listing.priceArs;
    const platformFeeArs = Math.max(1, Math.round(priceArs * PLATFORM_FEE_PERCENT));

    // 5. Build back URLs and notification URL
    const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
    const txBase = `${appUrl}/transactions`;
    const notificationUrl = `${appUrl}/api/webhooks/mercadopago`;

    // 6. Get buyer profile for MP payer pre-fill
    const buyerProfile = await getUserProfile(user.id);

    // 7. Create MP preference (posted under seller's token)
    const preference = await createMpPreference({
      sellerAccessToken,
      title: `${listing.cardName} — TCG Marketplace AR`,
      unitPriceArs: priceArs,
      quantity: 1,
      platformFeeArs,
      successUrl: `${txBase}?mp_status=success&tx=${reservation.transactionId}`,
      failureUrl: `${txBase}?mp_status=failure&tx=${reservation.transactionId}`,
      pendingUrl: `${txBase}?mp_status=pending&tx=${reservation.transactionId}`,
      notificationUrl,
      externalReference: reservation.transactionId,
      payerEmail: buyerProfile?.email ?? undefined,
    });

    // 8. Stamp payment_event with MP data
    await updatePaymentMpCheckout({
      transactionId: reservation.transactionId,
      mpPreferenceId: preference.id,
      mpCheckoutUrl: preference.initPoint,
      platformFeeArs,
    });
    pendingReservation = null;

    log.info("MP checkout created", {
      transactionId: reservation.transactionId,
      preferenceId: preference.id,
      buyerId: user.id,
      sellerId: listing.sellerId,
      priceArs,
      platformFeeArs,
    });

    // Use sandbox URL in development
    const checkoutUrl =
      process.env.NODE_ENV === "production"
        ? preference.initPoint
        : preference.sandboxInitPoint;

    return Response.json({
      checkoutUrl,
      transactionId: reservation.transactionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    if (pendingReservation) {
      try {
        await releasePendingCheckoutReservation(pendingReservation);
      } catch (rollbackError) {
        log.error("Checkout rollback error", {
          listingId: pendingReservation.listingId,
          transactionId: pendingReservation.transactionId,
          message: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
        });
      }
    }
    log.error("Checkout error", { listingId, buyerId: user.id, message });
    const status = message === "Listing is not available." ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
