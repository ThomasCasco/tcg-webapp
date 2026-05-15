import { describe, it, expect } from "vitest";
import {
  verificationLabelEs,
  fulfillmentLabelEs,
} from "@/lib/shared/fulfillment-labels";
import type { FulfillmentStatus, PaymentVerificationStatus } from "@/lib/domain/types";

describe("verificationLabelEs", () => {
  it("covers all PaymentVerificationStatus values", () => {
    const statuses: PaymentVerificationStatus[] = ["verified", "pending_review"];
    for (const status of statuses) {
      expect(verificationLabelEs[status]).toBeDefined();
      expect(typeof verificationLabelEs[status]).toBe("string");
      expect(verificationLabelEs[status].length).toBeGreaterThan(0);
    }
  });

  it("'verified' has a non-empty Spanish label", () => {
    expect(verificationLabelEs["verified"]).toBe(
      "Verificado con el proveedor (MP/Stripe)",
    );
  });

  it("'pending_review' has a non-empty Spanish label", () => {
    expect(verificationLabelEs["pending_review"]).toBe(
      "Pendiente de revisión / comprobante manual",
    );
  });

  it("has exactly 2 entries (one per status)", () => {
    expect(Object.keys(verificationLabelEs)).toHaveLength(2);
  });
});

describe("fulfillmentLabelEs", () => {
  const allStatuses: FulfillmentStatus[] = [
    "pending",
    "seller_confirmed",
    "shipped",
    "delivered",
    "disputed",
    "closed",
  ];

  it("covers all FulfillmentStatus values", () => {
    for (const status of allStatuses) {
      expect(fulfillmentLabelEs[status]).toBeDefined();
      expect(typeof fulfillmentLabelEs[status]).toBe("string");
      expect(fulfillmentLabelEs[status].length).toBeGreaterThan(0);
    }
  });

  it("has exactly 6 entries (one per status)", () => {
    expect(Object.keys(fulfillmentLabelEs)).toHaveLength(6);
  });

  it("'pending' label mentions pending verification", () => {
    expect(fulfillmentLabelEs["pending"]).toBe(
      "Pago: pendiente de verificación",
    );
  });

  it("'seller_confirmed' label mentions payment credited", () => {
    expect(fulfillmentLabelEs["seller_confirmed"]).toBe(
      "Pago acreditado: coordiná envío o retiro",
    );
  });

  it("'shipped' label mentions envío", () => {
    expect(fulfillmentLabelEs["shipped"]).toBe(
      "Enviado (esperando recepción)",
    );
  });

  it("'delivered' label mentions entregado", () => {
    expect(fulfillmentLabelEs["delivered"]).toBe(
      "Entregado / cerrado por comprador",
    );
  });

  it("'disputed' label mentions disputa", () => {
    expect(fulfillmentLabelEs["disputed"]).toBe("En disputa");
  });

  it("'closed' label is Cerrado", () => {
    expect(fulfillmentLabelEs["closed"]).toBe("Cerrado");
  });

  it("all labels are strings with actual content", () => {
    for (const [key, value] of Object.entries(fulfillmentLabelEs)) {
      expect(typeof value).toBe("string");
      expect(value.trim().length).toBeGreaterThan(0);
      // No key should map to the same value as another key
      const duplicates = Object.entries(fulfillmentLabelEs).filter(
        ([k, v]) => v === value && k !== key,
      );
      expect(duplicates).toHaveLength(0);
    }
  });
});
