import type { FulfillmentStatus } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { updateFulfillmentStatus } from "@/lib/server/repository";
import { getTransactionContext, inferDeliveryMode } from "@/lib/server/transaction-context";
import { createNotification } from "@/lib/server/notifications";
import { sendShippedToBuyer, sendDeliveredToSeller } from "@/lib/server/email";
import { log } from "@/lib/server/logger";

type FulfillmentPayload = {
  status?: FulfillmentStatus;
  trackingNumber?: string;
};

const allowedStatuses: FulfillmentStatus[] = [
  "seller_confirmed",
  "shipped",
  "delivered",
  "disputed",
  "closed",
];

function isStatus(value: unknown): value is FulfillmentStatus {
  return typeof value === "string" && allowedStatuses.includes(value as FulfillmentStatus);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: FulfillmentPayload;
  try {
    payload = (await request.json()) as FulfillmentPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isStatus(payload.status)) {
    return Response.json(
      { error: "status is required and must be a valid value." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const trackingNumber = payload.trackingNumber?.trim();

  // Tracking obligatorio cuando se marca shipped en una operación de envío.
  if (payload.status === "shipped") {
    const ctxBefore = await getTransactionContext(id);
    if (!ctxBefore) {
      return Response.json({ error: "Transacción no encontrada." }, { status: 404 });
    }
    const mode = inferDeliveryMode(ctxBefore);
    if (mode === "shipping" && (!trackingNumber || trackingNumber.length < 4)) {
      return Response.json(
        { error: "Para marcar como enviado necesitás un número de seguimiento (mínimo 4 caracteres)." },
        { status: 400 },
      );
    }
  }

  try {
    const payment = await updateFulfillmentStatus({
      transactionId: id,
      actorUserId: user.id,
      nextStatus: payload.status,
      trackingNumber,
    });

    // Side effects: emails + in-app notifications. Fire-and-forget — failures
    // here should not roll back the state transition the user already saw.
    void notifyAfterFulfillmentChange({
      transactionId: id,
      nextStatus: payload.status,
      tracking: trackingNumber ?? payment.shippingTracking ?? "",
    }).catch((err) =>
      log.error("notifyAfterFulfillmentChange failed", {
        transactionId: id,
        nextStatus: payload.status,
        error: err instanceof Error ? err.message : String(err),
      }),
    );

    return Response.json({ payment });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update fulfillment status.",
      },
      { status: 500 },
    );
  }
}

async function notifyAfterFulfillmentChange(opts: {
  transactionId: string;
  nextStatus: FulfillmentStatus;
  tracking: string;
}): Promise<void> {
  const ctx = await getTransactionContext(opts.transactionId);
  if (!ctx) return;
  const linkPath = `/transactions/${ctx.transactionId}`;
  const mode = inferDeliveryMode(ctx);

  if (opts.nextStatus === "shipped" && ctx.buyer.id) {
    if (ctx.buyer.email) {
      await sendShippedToBuyer({
        to: ctx.buyer.email,
        buyerName: ctx.buyer.username,
        sellerName: ctx.seller.username,
        cardName: ctx.cardName,
        tracking: opts.tracking || "—",
        transactionId: ctx.transactionId,
      }).catch((err) => log.error("shipped email failed", { error: String(err) }));
    }
    await createNotification({
      userId: ctx.buyer.id,
      type: "shipped_to_buyer",
      title: mode === "pickup" ? "Coordinen el retiro" : "Tu carta ya viaja",
      body:
        mode === "pickup"
          ? `${ctx.seller.username} marcó la entrega de ${ctx.cardName} como coordinada.`
          : `${ctx.seller.username} envió ${ctx.cardName}${opts.tracking ? ` (tracking: ${opts.tracking})` : ""}.`,
      linkPath,
    });
  }

  if (opts.nextStatus === "delivered") {
    if (ctx.seller.id && ctx.seller.email) {
      await sendDeliveredToSeller({
        to: ctx.seller.email,
        sellerName: ctx.seller.username,
        buyerName: ctx.buyer.username,
        cardName: ctx.cardName,
        transactionId: ctx.transactionId,
      }).catch((err) => log.error("delivered email failed", { error: String(err) }));
    }
    if (ctx.seller.id) {
      await createNotification({
        userId: ctx.seller.id,
        type: "delivered_to_seller",
        title: "Entrega confirmada",
        body: `${ctx.buyer.username} confirmó la recepción de ${ctx.cardName}.`,
        linkPath,
      });
    }
    // Prompt the buyer to rate the seller.
    if (ctx.buyer.id) {
      await createNotification({
        userId: ctx.buyer.id,
        type: "rate_seller_prompt",
        title: "Puntuá la operación",
        body: `¿Cómo fue tu experiencia comprándole a ${ctx.seller.username}?`,
        linkPath,
      });
    }
  }
}
