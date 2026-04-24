import type { PaymentProvider } from "@/lib/domain/types";

type VerifiableProvider = Exclude<PaymentProvider, "external_link">;

export type ProviderPaymentVerification = {
  provider: VerifiableProvider;
  providerPaymentId: string;
  normalizedStatus: string;
  rawStatus: string;
};

function normalizeStatus(value: unknown): string {
  if (typeof value !== "string") {
    return "unknown";
  }

  const normalized = value.trim().toLowerCase();
  return normalized || "unknown";
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

async function parseJsonOrThrow(response: Response): Promise<Record<string, unknown>> {
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (payload) {
    return payload;
  }

  throw new Error("Invalid provider API response.");
}

async function verifyMercadoPagoPayment(
  providerPaymentId: string,
): Promise<ProviderPaymentVerification> {
  const token = requiredEnv("MERCADO_PAGO_ACCESS_TOKEN");

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(providerPaymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = await parseJsonOrThrow(response);

  if (!response.ok) {
    const providerMessage =
      typeof payload.message === "string"
        ? payload.message
        : typeof payload.error === "string"
          ? payload.error
          : `Mercado Pago API error: ${response.status}`;

    throw new Error(providerMessage);
  }

  const rawStatus = typeof payload.status === "string" ? payload.status : "unknown";

  return {
    provider: "mercado_pago",
    providerPaymentId,
    normalizedStatus: normalizeStatus(rawStatus),
    rawStatus,
  };
}

async function verifyStripePaymentIntent(
  providerPaymentId: string,
): Promise<ProviderPaymentVerification> {
  const secretKey = requiredEnv("STRIPE_SECRET_KEY");

  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(providerPaymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    },
  );

  const payload = await parseJsonOrThrow(response);

  if (!response.ok) {
    const errorObj = payload.error as { message?: string } | undefined;
    const providerMessage =
      typeof errorObj?.message === "string"
        ? errorObj.message
        : `Stripe API error: ${response.status}`;

    throw new Error(providerMessage);
  }

  const rawStatus = typeof payload.status === "string" ? payload.status : "unknown";

  return {
    provider: "stripe",
    providerPaymentId,
    normalizedStatus: normalizeStatus(rawStatus),
    rawStatus,
  };
}

export async function verifyPaymentWithProviderAPI(input: {
  provider: PaymentProvider;
  providerPaymentId: string;
}): Promise<ProviderPaymentVerification> {
  if (input.provider === "mercado_pago") {
    return verifyMercadoPagoPayment(input.providerPaymentId);
  }

  if (input.provider === "stripe") {
    return verifyStripePaymentIntent(input.providerPaymentId);
  }

  throw new Error("external_link does not support provider API verification.");
}
