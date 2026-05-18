/**
 * POST /api/transactions/[id]/rate
 *
 * Buyer rates the seller after delivery. The domain mutation enforces the
 * buyer-only, delivered-only and one-rating-per-transaction rules.
 */

import { requireAuthenticatedUser } from "@/lib/server/auth";
import { updateFulfillmentStatus } from "@/lib/server/repository";
import { submitSellerRating } from "@/lib/server/reputation/mutations";
import { getTransactionContext } from "@/lib/server/transaction-context";
import { createNotification } from "@/lib/server/notifications";
import { sendRatingReceived } from "@/lib/server/email";
import { log } from "@/lib/server/logger";

type RatePayload = {
  stars?: unknown;
  comment?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: RatePayload;
  try {
    payload = (await request.json()) as RatePayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const stars = Number(payload.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return Response.json({ error: "stars debe ser un entero entre 1 y 5." }, { status: 400 });
  }

  const comment = typeof payload.comment === "string" ? payload.comment.trim() : "";
  if (comment.length > 600) {
    return Response.json({ error: "El comentario no puede superar los 600 caracteres." }, { status: 400 });
  }

  const { id: transactionId } = await context.params;

  try {
    const result = await submitSellerRating({
      transactionId,
      actorUserId: user.id,
      stars,
      comment: comment.length > 0 ? comment : undefined,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    if (!result.created) {
      return Response.json({ rating: result.rating, idempotent: true });
    }

    try {
      await updateFulfillmentStatus({
        transactionId,
        actorUserId: user.id,
        nextStatus: "closed",
      });
    } catch (err) {
      log.warn("rate: could not close transaction", {
        transactionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const ctx = await getTransactionContext(transactionId);
    if (!ctx?.seller.id) {
      log.warn("rate: missing transaction context after rating", { transactionId });
      return Response.json({ rating: result.rating });
    }

    const linkPath = `/transactions/${transactionId}`;
    if (ctx.seller.email) {
      await sendRatingReceived({
        to: ctx.seller.email,
        sellerName: ctx.seller.username,
        buyerName: ctx.buyer.username,
        cardName: ctx.cardName,
        stars,
        comment: comment.length > 0 ? comment : undefined,
        transactionId,
      }).catch((e) => log.error("rating email failed", { error: String(e) }));
    }

    await createNotification({
      userId: ctx.seller.id,
      type: "rating_received_seller",
      title: `Te calificaron ${stars}/5`,
      body: `${ctx.buyer.username} valoro la operacion de ${ctx.cardName}.`,
      linkPath,
    });

    return Response.json({ rating: result.rating });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit rating.",
      },
      { status: 500 },
    );
  }
}
