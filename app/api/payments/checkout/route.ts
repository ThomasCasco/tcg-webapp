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
import { computePlatformFeeArs, getPlatformFeeConfig } from "@/lib/shared/platform-fee";
import { checkoutExpiresAt } from "@/lib/shared/reservations";

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`checkout:${user.id}:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Demasiados intentos seguidos. Esperá ${limit.retryAfterSeconds} segundos.` },
      { status: 429 },
    );
  }

  let listingId: string;
  try {
    const body = await request.json() as { listingId?: unknown };
    listingId = String(body.listingId ?? "").trim();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!listingId) {
    return Response.json({ error: "Falta la publicación." }, { status: 400 });
  }

  let pendingReservation: { listingId: string; transactionId: string } | null = null;

  try {
    // 1. Validate listing exists and is purchasable
    const listing = await getListingById(listingId);
    if (!listing) {
      return Response.json({ error: "Esta publicación ya no existe." }, { status: 404 });
    }
    if (listing.status !== "active") {
      return Response.json(
        { error: "Alguien la está comprando ahora mismo o ya se vendió." },
        { status: 409 },
      );
    }
    if (listing.sellerId === user.id) {
      return Response.json({ error: "No podés comprar tu propia publicación." }, { status: 409 });
    }
    if (!listing.sellerId) {
      return Response.json({ error: "Esta publicación no se puede comprar." }, { status: 409 });
    }

    // 2. Get seller's valid MP access token
    let sellerAccessToken: string;
    try {
      sellerAccessToken = await getValidAccessToken(listing.sellerId);
    } catch {
      return Response.json(
        { error: "Este vendedor todavía no puede cobrar por Mercado Pago." },
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

    // 4. Compute platform fee (whole pesos; 0 while the launch promo is on)
    const priceArs = listing.priceArs;
    const platformFeeArs = computePlatformFeeArs(priceArs, getPlatformFeeConfig());

    // 5. Build back URLs and notification URL
    const { getAppUrl } = await import("@/lib/shared/app-url");
    const appUrl = getAppUrl();
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
      successUrl: `${txBase}/${reservation.transactionId}?mp_status=success`,
      failureUrl: `${txBase}?mp_status=failure&tx=${reservation.transactionId}`,
      pendingUrl: `${txBase}/${reservation.transactionId}?mp_status=pending`,
      notificationUrl,
      externalReference: reservation.transactionId,
      payerEmail: buyerProfile?.email ?? undefined,
      expiresAt: checkoutExpiresAt(),
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
    // reserveListing throws "Listing is not available." when another buyer won the race.
    if (message === "Listing is not available.") {
      return Response.json(
        { error: "Alguien la está comprando ahora mismo o ya se vendió." },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "No pudimos abrir el pago. Probá de nuevo en unos segundos." },
      { status: 500 },
    );
  }
}
