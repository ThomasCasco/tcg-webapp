import type { PaymentProvider } from "@/lib/domain/types";
import { verifyTransaction } from "@/lib/server/repository";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

type VerifyPaymentPayload = {
  transactionId?: string;
  provider?: PaymentProvider;
  providerPaymentId?: string;
  providerStatus?: string;
};

const acceptedProviders: PaymentProvider[] = [
  "mercado_pago",
  "stripe",
  "external_link",
];

const successStatuses = new Set(["approved", "accredited", "succeeded"]);

function isProvider(value: unknown): value is PaymentProvider {
  return typeof value === "string" && acceptedProviders.includes(value as PaymentProvider);
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`payments-verify:${ip}`, 40, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const webhookSecret = request.headers.get("x-webhook-secret");
  const isWebhookCall =
    Boolean(process.env.PAYMENT_WEBHOOK_SECRET) &&
    webhookSecret === process.env.PAYMENT_WEBHOOK_SECRET;

  const user = !isWebhookCall
    ? await requireAuthenticatedUser().catch(() => null)
    : null;

  if (!isWebhookCall && !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: VerifyPaymentPayload;

  try {
    payload = (await request.json()) as VerifyPaymentPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.transactionId || payload.transactionId.trim().length < 6) {
    return Response.json(
      { error: "transactionId is required and must be at least 6 chars." },
      { status: 400 },
    );
  }

  if (!isProvider(payload.provider)) {
    return Response.json(
      { error: "provider is required and must be a supported value." },
      { status: 400 },
    );
  }

  if (!payload.providerPaymentId || payload.providerPaymentId.trim().length < 4) {
    return Response.json(
      { error: "providerPaymentId is required." },
      { status: 400 },
    );
  }

  const normalizedStatus = (payload.providerStatus ?? "pending").toLowerCase();
  const isVerified = successStatuses.has(normalizedStatus);

  try {
    const result = await verifyTransaction({
      transactionId: payload.transactionId,
      actorUserId: user?.id,
      bypassOwnership: isWebhookCall,
      provider: payload.provider,
      providerPaymentId: payload.providerPaymentId,
      providerStatus: normalizedStatus,
    });

    return Response.json({
      transactionId: payload.transactionId,
      provider: payload.provider,
      providerPaymentId: payload.providerPaymentId,
      verificationStatus: result.payment.verificationStatus,
      requiresManualCheck: result.requiresManualCheck,
      checkedAt: result.payment.checkedAt,
      listingStatusAfterVerification: isVerified ? "sold" : "pending_payment",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify transaction.",
      },
      { status: 500 },
    );
  }
}