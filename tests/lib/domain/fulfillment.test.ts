import { describe, expect, it } from "vitest";
import { checkFulfillmentTransition } from "@/lib/domain/fulfillment";

const paid = { paymentVerified: true } as const;

describe("checkFulfillmentTransition", () => {
  it("blocks everything until the payment is verified", () => {
    expect(
      checkFulfillmentTransition({ actor: "seller", from: "pending", to: "shipped", paymentVerified: false }).ok,
    ).toBe(false);
  });

  it("lets only the seller mark shipped, once", () => {
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "seller_confirmed", to: "shipped" }).ok).toBe(true);
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "seller_confirmed", to: "shipped" }).ok).toBe(false);
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "shipped", to: "shipped" }).ok).toBe(false);
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "delivered", to: "shipped" }).ok).toBe(false);
  });

  it("lets only the buyer confirm delivery", () => {
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "shipped", to: "delivered" }).ok).toBe(true);
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "seller_confirmed", to: "delivered" }).ok).toBe(true);
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "shipped", to: "delivered" }).ok).toBe(false);
  });

  it("closes only after delivery, by the buyer", () => {
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "delivered", to: "closed" }).ok).toBe(true);
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "delivered", to: "closed" }).ok).toBe(false);
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "shipped", to: "closed" }).ok).toBe(false);
  });

  it("freezes closed and disputed operations", () => {
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "closed", to: "delivered" }).ok).toBe(false);
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "disputed", to: "shipped" }).ok).toBe(false);
  });

  it("rejects statuses that are set elsewhere", () => {
    expect(checkFulfillmentTransition({ ...paid, actor: "seller", from: "pending", to: "seller_confirmed" }).ok).toBe(false);
    expect(checkFulfillmentTransition({ ...paid, actor: "buyer", from: "shipped", to: "disputed" }).ok).toBe(false);
  });
});
