type PaymentProvider = "mercado_pago" | "stripe" | "external_link";

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
  const requiresManualCheck = payload.provider === "external_link" || !isVerified;

  return Response.json({
    transactionId: payload.transactionId,
    provider: payload.provider,
    providerPaymentId: payload.providerPaymentId,
    verificationStatus: isVerified ? "verified" : "pending_review",
    requiresManualCheck,
    note: "Webhook persistence and provider SDK validation will be connected in the next sprint.",
    checkedAt: new Date().toISOString(),
  });
}