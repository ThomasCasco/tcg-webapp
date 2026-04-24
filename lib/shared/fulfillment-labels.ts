import type { FulfillmentStatus, PaymentVerificationStatus } from "@/lib/domain/types";

export const verificationLabelEs: Record<PaymentVerificationStatus, string> = {
  verified: "Verificado con el proveedor (MP/Stripe)",
  pending_review: "Pendiente de revisión / comprobante manual",
};

export const fulfillmentLabelEs: Record<FulfillmentStatus, string> = {
  pending: "Pago: pendiente de verificación",
  seller_confirmed: "Pago acreditado: coordiná envío o retiro",
  shipped: "Enviado (esperando recepción)",
  delivered: "Entregado / cerrado por comprador",
  disputed: "En disputa",
  closed: "Cerrado",
};
