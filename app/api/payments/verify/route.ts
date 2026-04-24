import type { PaymentProvider } from "@/lib/domain/types";
import {
  getTransactionProvider,
  verifyTransaction,
} from "@/lib/server/repository";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { verifyPaymentWithProviderAPI } from "@/lib/server/payment-verifier";
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

  if (!payload.providerPaymentId || payload.providerPaymentId.trim().length < 4) {
    return Response.json(
      { error: "providerPaymentId is required." },
      { status: 400 },
    );
  }

  const transactionId = payload.transactionId.trim();
  let transactionProvider: PaymentProvider;

  try {
    transactionProvider = await getTransactionProvider(transactionId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load transaction provider.";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }

  if (payload.provider && !isProvider(payload.provider)) {
    return Response.json(
      { error: "provider must be a supported value when provided." },
      { status: 400 },
    );
  }

  if (payload.provider && payload.provider !== transactionProvider) {
    return Response.json(
      {
        error: `Provider mismatch. Transaction expects ${transactionProvider}.`,
      },
      { status: 400 },
    );
  }

  const providerPaymentId = payload.providerPaymentId.trim();
  let normalizedStatus = "pending";
  let providerStatusSource: "provider_api" | "manual_payload" = "manual_payload";

  if (transactionProvider === "external_link") {
    normalizedStatus = (payload.providerStatus ?? "pending").trim().toLowerCase() || "pending";
  } else {
    try {
      const providerLookup = await verifyPaymentWithProviderAPI({
        provider: transactionProvider,
        providerPaymentId,
      });
      normalizedStatus = providerLookup.normalizedStatus;
      providerStatusSource = "provider_api";
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to validate payment with provider API.",
        },
        { status: 502 },
      );
    }
  }

  try {
    const result = await verifyTransaction({
      transactionId,
      actorUserId: user?.id,
      bypassOwnership: isWebhookCall,
      provider: transactionProvider,
      providerPaymentId,
      providerStatus: normalizedStatus,
    });

    return Response.json({
      transactionId,
      provider: transactionProvider,
      providerPaymentId,
      providerStatus: normalizedStatus,
      providerStatusSource,
      verificationStatus: result.payment.verificationStatus,
      requiresManualCheck: result.requiresManualCheck,
      checkedAt: result.payment.checkedAt,
      listingStatusAfterVerification:
        result.payment.verificationStatus === "verified" ? "sold" : "pending_payment",
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