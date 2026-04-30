/**
 * POST /api/admin/payments/manual-verify
 *
 * Admin-only fallback to manually verify a payment when the MP webhook
 * did not fire (e.g., sandbox, or network issues).
 *
 * Body: { transactionId: string; mpPaymentId: string; providerStatus?: string }
 *
 * Protected by ADMIN_SECRET env var.
 */

import { verifyTransaction, setPaymentMpPaymentId } from "@/lib/server/repository";
import { log } from "@/lib/server/logger";

type RequestBody = {
  transactionId?: unknown;
  mpPaymentId?: unknown;
  providerStatus?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  // Simple secret check — swap for proper admin auth in prod
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  if (adminSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${adminSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // In production, require the secret to be configured
    return Response.json({ error: "ADMIN_SECRET not configured" }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transactionId = String(body.transactionId ?? "").trim();
  const mpPaymentId = String(body.mpPaymentId ?? "").trim();
  const providerStatus = String(body.providerStatus ?? "approved").trim();

  if (!transactionId || !mpPaymentId) {
    return Response.json(
      { error: "transactionId and mpPaymentId are required." },
      { status: 400 },
    );
  }

  try {
    // Stamp mp_payment_id first
    await setPaymentMpPaymentId({ transactionId, mpPaymentId });

    const result = await verifyTransaction({
      transactionId,
      bypassOwnership: true,
      provider: "mercado_pago",
      providerPaymentId: mpPaymentId,
      providerStatus,
    });

    log.info("admin/manual-verify: transaction verified", {
      transactionId,
      mpPaymentId,
      verificationStatus: result.payment.verificationStatus,
    });

    return Response.json({
      transactionId,
      verificationStatus: result.payment.verificationStatus,
      fulfillmentStatus: result.payment.fulfillmentStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    log.error("admin/manual-verify: error", { transactionId, mpPaymentId, message });
    return Response.json({ error: message }, { status: 500 });
  }
}
