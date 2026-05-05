/**
 * Mercado Pago API client — server-side only.
 *
 * Uses raw fetch (no SDK) for maximum control and minimal bundle size.
 * All calls that operate on behalf of a seller use the seller's access_token.
 * Platform operations (e.g. verifying a payment in our account) use MP_ACCESS_TOKEN.
 */

const MP_API = "https://api.mercadopago.com";

export type MpPreferenceInput = {
  /** Seller's OAuth access_token */
  sellerAccessToken: string;
  /** Listing / transaction data */
  title: string;
  unitPriceArs: number;
  quantity: number;
  platformFeeArs: number;
  /** Back URLs after payment */
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  /** Notification webhook */
  notificationUrl: string;
  /** Internal reference */
  externalReference: string;
  /** Buyer email (pre-fill on MP checkout) */
  payerEmail?: string;
};

export type MpPreferenceResult = {
  id: string;
  initPoint: string;       // production checkout URL
  sandboxInitPoint: string; // sandbox checkout URL
};

export type MpPaymentInfo = {
  id: number;
  status: string;
  statusDetail: string;
  transactionAmount: number;
  currencyId: string;
  externalReference: string | null;
  collectorId: number;
  marketplaceFee: number;
  preferenceId: string | null;
};

export type MpTokenResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;    // seconds
  mpUserId: string;
  scope: string;
  liveMode: boolean;
};

function appId(): string {
  const v = process.env.MP_APP_ID?.trim();
  if (!v) throw new Error("Missing MP_APP_ID env var");
  return v;
}

function clientSecret(): string {
  const v = process.env.MP_CLIENT_SECRET?.trim();
  if (!v) throw new Error("Missing MP_CLIENT_SECRET env var");
  return v;
}

function platformToken(): string {
  const v = process.env.MP_ACCESS_TOKEN?.trim();
  if (!v) throw new Error("Missing MP_ACCESS_TOKEN env var");
  return v;
}

async function mpFetch<T>(
  url: string,
  options: RequestInit & { token: string },
): Promise<T> {
  const { token, ...rest } = options;
  const res = await fetch(`${MP_API}${url}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as T | { message?: string; error?: string } | null;

  if (!res.ok) {
    const msg =
      (body as { message?: string })?.message ??
      (body as { error?: string })?.error ??
      `MP API ${res.status}`;
    throw new Error(msg);
  }

  return body as T;
}

/**
 * Create a checkout preference on behalf of the seller.
 * The seller's access_token is used so the payment goes to their account.
 * marketplace_fee is automatically transferred to our platform account.
 */
export async function createMpPreference(input: MpPreferenceInput): Promise<MpPreferenceResult> {
  type RawPreference = {
    id: string;
    init_point: string;
    sandbox_init_point: string;
  };

  const body = {
    items: [
      {
        title: input.title,
        quantity: input.quantity,
        unit_price: input.unitPriceArs,
        currency_id: "ARS",
      },
    ],
    marketplace_fee: input.platformFeeArs,
    back_urls: {
      success: input.successUrl,
      failure: input.failureUrl,
      pending: input.pendingUrl,
    },
    auto_return: "approved",
    notification_url: input.notificationUrl,
    external_reference: input.externalReference,
    ...(input.payerEmail ? { payer: { email: input.payerEmail } } : {}),
    statement_descriptor: "TCG Marketplace AR",
  };

  const raw = await mpFetch<RawPreference>("/checkout/preferences", {
    method: "POST",
    token: input.sellerAccessToken,
    body: JSON.stringify(body),
  });

  return {
    id: raw.id,
    initPoint: raw.init_point,
    sandboxInitPoint: raw.sandbox_init_point,
  };
}

/**
 * Fetch payment info from MP API using the platform token.
 * (Payments are visible to the platform in marketplace mode.)
 */
export async function getMpPayment(mpPaymentId: string): Promise<MpPaymentInfo> {
  type RawPayment = {
    id: number;
    status: string;
    status_detail: string;
    transaction_amount: number;
    currency_id: string;
    external_reference: string | null;
    collector_id: number;
    marketplace_fee: number | null;
    preference_id?: string | null;
  };

  const raw = await mpFetch<RawPayment>(`/v1/payments/${encodeURIComponent(mpPaymentId)}`, {
    method: "GET",
    token: platformToken(),
  });

  return {
    id: raw.id,
    status: raw.status,
    statusDetail: raw.status_detail,
    transactionAmount: raw.transaction_amount,
    currencyId: raw.currency_id,
    externalReference: raw.external_reference,
    collectorId: raw.collector_id,
    marketplaceFee: raw.marketplace_fee ?? 0,
    preferenceId: raw.preference_id ?? null,
  };
}

/**
 * Exchange OAuth authorization code for tokens.
 */
export async function exchangeMpCode(code: string, redirectUri: string): Promise<MpTokenResult> {
  type RawToken = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: number;
    scope: string;
    live_mode: boolean;
  };

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: appId(),
    client_secret: clientSecret(),
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const raw = (await res.json().catch(() => null)) as RawToken | { message?: string } | null;

  if (!res.ok || !raw) {
    const msg = (raw as { message?: string })?.message ?? `MP OAuth error ${res.status}`;
    throw new Error(msg);
  }

  const t = raw as RawToken;
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresIn: t.expires_in,
    mpUserId: String(t.user_id),
    scope: t.scope,
    liveMode: t.live_mode,
  };
}

/**
 * Refresh an expired access_token using the refresh_token.
 */
export async function refreshMpToken(refreshToken: string): Promise<MpTokenResult> {
  type RawToken = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: number;
    scope: string;
    live_mode: boolean;
  };

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: appId(),
    client_secret: clientSecret(),
    refresh_token: refreshToken,
  });

  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const raw = (await res.json().catch(() => null)) as RawToken | { message?: string } | null;

  if (!res.ok || !raw) {
    const msg = (raw as { message?: string })?.message ?? `MP refresh error ${res.status}`;
    throw new Error(msg);
  }

  const t = raw as RawToken;
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresIn: t.expires_in,
    mpUserId: String(t.user_id),
    scope: t.scope,
    liveMode: t.live_mode,
  };
}

/**
 * Build the MP OAuth authorization URL for seller onboarding.
 */
export function getMpAuthorizationUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: appId(),
    response_type: "code",
    platform_id: "mp",
    redirect_uri: redirectUri,
    state,
  });
  return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

/**
 * Validate a MP webhook signature.
 * MP sends: x-signature: ts={ts},v1={hmac}
 * HMAC = HMAC-SHA256("{data.id}.{x-request-id}.{ts}", MP_WEBHOOK_SECRET)
 */
export async function validateMpWebhookSignature(opts: {
  xSignature: string;
  xRequestId: string;
  dataId: string;
}): Promise<boolean> {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing MP_WEBHOOK_SECRET env var");
  }

  // Parse ts and v1 from x-signature header
  const parts = Object.fromEntries(
    opts.xSignature.split(",").map((p) => p.split("=") as [string, string]),
  );
  const ts = parts["ts"];
  const receivedHash = parts["v1"];
  if (!ts || !receivedHash) return false;

  // Build the signed template
  const template = `id:${opts.dataId};request-id:${opts.xRequestId};ts:${ts};`;

  // Compute HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(template);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const computedHash = Buffer.from(signature).toString("hex");

  // Constant-time comparison
  if (computedHash.length !== receivedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ receivedHash.charCodeAt(i);
  }
  return diff === 0;
}
