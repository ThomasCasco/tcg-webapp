import type { FulfillmentStatus } from "@/lib/domain/types";

export type FulfillmentActor = "buyer" | "seller";

export type FulfillmentTransitionCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Allowed post-payment transitions. Disputes are opened through the disputes
 * API and `seller_confirmed` is set by payment verification, so neither can be
 * requested here.
 *
 * - shipped: the seller dispatched the card (or handed it over in person).
 * - delivered: the buyer confirms receipt. Allowed before "shipped" too, since
 *   confirming receipt only ever favours the seller (e.g. pickup in person).
 * - closed: set after the buyer rates the operation.
 */
export function checkFulfillmentTransition(input: {
  actor: FulfillmentActor;
  from: FulfillmentStatus;
  to: FulfillmentStatus;
  paymentVerified: boolean;
}): FulfillmentTransitionCheck {
  const { actor, from, to, paymentVerified } = input;

  if (!paymentVerified) {
    return { ok: false, reason: "El pago todavía no está acreditado." };
  }
  if (from === "closed") {
    return { ok: false, reason: "La operación ya está cerrada." };
  }
  if (from === "disputed") {
    return { ok: false, reason: "La operación está en disputa." };
  }

  switch (to) {
    case "shipped":
      if (actor !== "seller") {
        return { ok: false, reason: "Solo el vendedor puede marcar el envío." };
      }
      if (from !== "pending" && from !== "seller_confirmed") {
        return { ok: false, reason: "La carta ya figura como enviada." };
      }
      return { ok: true };
    case "delivered":
      if (actor !== "buyer") {
        return { ok: false, reason: "Solo el comprador puede confirmar la recepción." };
      }
      if (from === "delivered") {
        return { ok: false, reason: "La recepción ya está confirmada." };
      }
      return { ok: true };
    case "closed":
      if (actor !== "buyer" || from !== "delivered") {
        return { ok: false, reason: "La operación se cierra cuando el comprador califica." };
      }
      return { ok: true };
    default:
      return { ok: false, reason: "Cambio de estado no permitido." };
  }
}
