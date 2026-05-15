import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyPaymentWithProviderAPI } from "@/lib/server/payment-verifier";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeErrorResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubEnv("MP_ACCESS_TOKEN", "mp-test-token");
  vi.stubEnv("STRIPE_SECRET_KEY", "stripe-test-key");
  vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(makeOkResponse({ status: "approved" }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Mercado Pago
// ---------------------------------------------------------------------------

describe("verifyPaymentWithProviderAPI – mercado_pago", () => {
  it("returns a verified result with normalizedStatus for an approved payment", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "approved", id: "mp-pay-1" }),
    );

    const result = await verifyPaymentWithProviderAPI({
      provider: "mercado_pago",
      providerPaymentId: "mp-pay-1",
    });

    expect(result.provider).toBe("mercado_pago");
    expect(result.providerPaymentId).toBe("mp-pay-1");
    expect(result.rawStatus).toBe("approved");
    expect(result.normalizedStatus).toBe("approved");
  });

  it("normalizes status to lowercase", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "APPROVED" }),
    );

    const result = await verifyPaymentWithProviderAPI({
      provider: "mercado_pago",
      providerPaymentId: "mp-pay-2",
    });

    expect(result.normalizedStatus).toBe("approved");
    expect(result.rawStatus).toBe("APPROVED");
  });

  it("uses 'unknown' when status field is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ id: "mp-pay-3" }), // no status field
    );

    const result = await verifyPaymentWithProviderAPI({
      provider: "mercado_pago",
      providerPaymentId: "mp-pay-3",
    });

    expect(result.rawStatus).toBe("unknown");
    expect(result.normalizedStatus).toBe("unknown");
  });

  it("calls the correct MP API endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "approved" }),
    );

    await verifyPaymentWithProviderAPI({
      provider: "mercado_pago",
      providerPaymentId: "pay-abc-123",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("mercadopago.com/v1/payments/pay-abc-123");
  });

  it("sends the Authorization header with the MP token", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "approved" }),
    );

    await verifyPaymentWithProviderAPI({
      provider: "mercado_pago",
      providerPaymentId: "pay-x",
    });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer mp-test-token",
    );
  });

  it("throws when MP returns a non-ok response with message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeErrorResponse({ message: "Payment not found" }, 404),
    );

    await expect(
      verifyPaymentWithProviderAPI({ provider: "mercado_pago", providerPaymentId: "bad-id" }),
    ).rejects.toThrow("Payment not found");
  });

  it("throws with error field when MP error response has no message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeErrorResponse({ error: "bad_request" }, 400),
    );

    await expect(
      verifyPaymentWithProviderAPI({ provider: "mercado_pago", providerPaymentId: "bad-id" }),
    ).rejects.toThrow("bad_request");
  });

  it("throws a generic error when MP error response has neither message nor error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeErrorResponse({}, 500),
    );

    await expect(
      verifyPaymentWithProviderAPI({ provider: "mercado_pago", providerPaymentId: "bad-id" }),
    ).rejects.toThrow("Mercado Pago API error: 500");
  });

  it("falls back to MERCADO_PAGO_ACCESS_TOKEN when MP_ACCESS_TOKEN is unset", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("MP_ACCESS_TOKEN", "");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "legacy-token");
    vi.stubEnv("STRIPE_SECRET_KEY", "stripe-test-key");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "approved" }),
    );

    await verifyPaymentWithProviderAPI({
      provider: "mercado_pago",
      providerPaymentId: "pay-legacy",
    });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer legacy-token",
    );
  });

  it("throws when both MP token env vars are missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("MP_ACCESS_TOKEN", "");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");

    await expect(
      verifyPaymentWithProviderAPI({ provider: "mercado_pago", providerPaymentId: "x" }),
    ).rejects.toThrow("Missing MP_ACCESS_TOKEN");
  });

  it("throws when the response body is not valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", { status: 200 }),
    );

    await expect(
      verifyPaymentWithProviderAPI({ provider: "mercado_pago", providerPaymentId: "x" }),
    ).rejects.toThrow("Invalid provider API response");
  });
});

// ---------------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------------

describe("verifyPaymentWithProviderAPI – stripe", () => {
  it("returns a verified result for a succeeded payment intent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "succeeded", id: "pi_stripe_1" }),
    );

    const result = await verifyPaymentWithProviderAPI({
      provider: "stripe",
      providerPaymentId: "pi_stripe_1",
    });

    expect(result.provider).toBe("stripe");
    expect(result.providerPaymentId).toBe("pi_stripe_1");
    expect(result.rawStatus).toBe("succeeded");
    expect(result.normalizedStatus).toBe("succeeded");
  });

  it("calls the correct Stripe API endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "succeeded" }),
    );

    await verifyPaymentWithProviderAPI({
      provider: "stripe",
      providerPaymentId: "pi_abc",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("stripe.com/v1/payment_intents/pi_abc");
  });

  it("sends the Authorization header with the Stripe secret key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ status: "succeeded" }),
    );

    await verifyPaymentWithProviderAPI({
      provider: "stripe",
      providerPaymentId: "pi_x",
    });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer stripe-test-key",
    );
  });

  it("throws using error.message from Stripe error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeErrorResponse({ error: { message: "No such payment_intent" } }, 404),
    );

    await expect(
      verifyPaymentWithProviderAPI({ provider: "stripe", providerPaymentId: "pi_bad" }),
    ).rejects.toThrow("No such payment_intent");
  });

  it("throws a generic Stripe error when no error.message is present", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeErrorResponse({ error: {} }, 500),
    );

    await expect(
      verifyPaymentWithProviderAPI({ provider: "stripe", providerPaymentId: "pi_bad" }),
    ).rejects.toThrow("Stripe API error: 500");
  });

  it("throws when STRIPE_SECRET_KEY is missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("MP_ACCESS_TOKEN", "mp-test-token");
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    await expect(
      verifyPaymentWithProviderAPI({ provider: "stripe", providerPaymentId: "pi_x" }),
    ).rejects.toThrow("Missing STRIPE_SECRET_KEY");
  });
});

// ---------------------------------------------------------------------------
// external_link (unsupported provider)
// ---------------------------------------------------------------------------

describe("verifyPaymentWithProviderAPI – external_link", () => {
  it("throws an error for external_link provider", async () => {
    await expect(
      verifyPaymentWithProviderAPI({
        provider: "external_link",
        providerPaymentId: "some-id",
      }),
    ).rejects.toThrow("external_link does not support provider API verification");
  });
});
