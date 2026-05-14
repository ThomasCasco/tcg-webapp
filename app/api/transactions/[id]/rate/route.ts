/**
 * POST /api/transactions/[id]/rate
 *
 * Buyer rates the seller after delivery. Writes the rating event, transitions
 * the transaction to `closed`, notifies the seller. Idempotent — a second
 * submission from the same buyer/transaction returns the existing rating.
 */

import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  createRating,
  getRatingByTransactionAndRater,
  updateFulfillmentStatus,
} from "@/lib/server/repository";
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

  const ctx = await getTransactionContext(transactionId);
  if (!ctx) {
    return Response.json({ error: "Transacción no encontrada." }, { status: 404 });
  }

  // Only the buyer rates the seller (one-way for now).
  if (ctx.buyer.id !== user.id) {
    return Response.json(
      { error: "Solo el comprador puede calificar al vendedor." },
      { status: 403 },
    );
  }
  if (!ctx.seller.id) {
    return Response.json({ error: "Falta el vendedor en la operación." }, { status: 422 });
  }

  // Idempotent: return existing rating if already submitted.
  const existing = await getRatingByTransactionAndRater(transactionId, user.id);
  if (existing) {
    return Response.json({ rating: existing, idempotent: true });
  }

  try {
    const rating = await createRating({
      transactionId,
      sellerId: ctx.seller.id,
      raterId: user.id,
      stars,
      comment: comment.length > 0 ? comment : undefined,
    });

    // Close the transaction. Caller is the buyer; this transition is allowed
    // by updateFulfillmentStatus (no role restriction on "closed").
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

    // Notify seller.
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
      body: `${ctx.buyer.username} valoró la operación de ${ctx.cardName}.`,
      linkPath,
    });

    return Response.json({ rating });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit rating.",
      },
      { status: 500 },
    );
  }
}
