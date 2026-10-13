/**
 * POST /api/transactions/[id]/cancel
 *
 * The buyer gives up an unpaid reservation so the card is available again.
 * Checks Mercado Pago first: if the payment already went through (webhook still
 * on its way), it is verified instead of cancelled.
 */

import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  FulfillmentTransitionError,
  cancelPendingReservation,
} from "@/lib/server/repository";
import { reconcileMpTransaction } from "@/lib/server/mp-reconcile";
import { log } from "@/lib/server/logger";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: transactionId } = await context.params;

  try {
    const outcome = await reconcileMpTransaction({ transactionId });
    if (outcome.kind === "verified") {
      return Response.json(
        { error: "Tu pago ya se acreditó, así que la compra sigue en pie." },
        { status: 409 },
      );
    }
  } catch (err) {
    // MP unreachable: cancelling is still safe, a late payment is recorded anyway.
    log.warn("cancel reservation: reconcile failed", {
      transactionId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    await cancelPendingReservation({ transactionId, buyerId: user.id });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof FulfillmentTransitionError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    log.error("cancel reservation failed", {
      transactionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "No pudimos cancelar la reserva." }, { status: 500 });
  }
}
