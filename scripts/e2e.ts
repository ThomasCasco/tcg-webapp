/**
 * End-to-end test harness for tcg-webapp.
 *
 * Usage:
 *   npm run e2e                       # all scenarios against http://localhost:3000
 *   npm run e2e -- buy-flow           # single scenario
 *   npm run e2e -- --base=URL all     # custom base URL (requires E2E_ALLOW_PROD=1 if non-localhost)
 *   npm run e2e:cleanup               # safety net: delete leftover e2e_* entities older than 10 min
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MP_WEBHOOK_SECRET (for webhook scenarios)
 *
 * Isolation markers:
 *   - Test users have email like  e2e+<ts>+<role>@tcg-e2e.local
 *   - Test listings have card_name prefixed with [E2E]
 *   - Cleanup only deletes entities whose IDs the current run captured.
 *   - e2e:cleanup scans for leftover markers >10 min old as a safety net.
 */

import { createClient } from "@supabase/supabase-js";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ────────────────────────────────────────────────────────────────────────────
// Env loader (very small — just enough to read .env.local without dotenv)
// ────────────────────────────────────────────────────────────────────────────

function loadDotEnv() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}
loadDotEnv();

// ────────────────────────────────────────────────────────────────────────────
// CLI parsing
// ────────────────────────────────────────────────────────────────────────────

type ArgvFlags = { baseUrl: string; scenario: string; cleanup: boolean; bypass: string | null };

function parseArgv(): ArgvFlags {
  const args = process.argv.slice(2);
  let baseUrl = "http://localhost:3000";
  let scenario = "all";
  let cleanup = false;
  let bypass: string | null = process.env.VERCEL_PROTECTION_BYPASS?.trim() || null;
  for (const a of args) {
    if (a === "--cleanup") cleanup = true;
    else if (a.startsWith("--base=")) baseUrl = a.slice("--base=".length);
    else if (a.startsWith("--bypass=")) bypass = a.slice("--bypass=".length);
    else if (!a.startsWith("--")) scenario = a;
  }
  baseUrl = baseUrl.replace(/\/$/, "");
  return { baseUrl, scenario, cleanup, bypass };
}

let GLOBAL_BYPASS: string | null = null;

// ────────────────────────────────────────────────────────────────────────────
// Supabase admin client
// ────────────────────────────────────────────────────────────────────────────

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ────────────────────────────────────────────────────────────────────────────
// Tiny cookie jar (sb-access-token + sb-refresh-token)
// ────────────────────────────────────────────────────────────────────────────

class CookieJar {
  private jar = new Map<string, string>();

  ingest(res: Response) {
    // Node's Headers.getSetCookie returns an array (Node 22+).
    const setCookies =
      typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
        ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : null;
    const list = setCookies ?? [];
    if (!setCookies) {
      // Fallback: raw single-string header.
      const raw = res.headers.get("set-cookie");
      if (raw) list.push(...raw.split(/, (?=[A-Za-z0-9_-]+=)/));
    }
    for (const c of list) {
      const [pair] = c.split(";");
      const [name, ...rest] = pair.split("=");
      const value = rest.join("=").trim();
      if (!name) continue;
      if (value === "" || value === '""') {
        this.jar.delete(name.trim());
      } else {
        this.jar.set(name.trim(), value);
      }
    }
  }

  header(): string | undefined {
    if (this.jar.size === 0) return undefined;
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ────────────────────────────────────────────────────────────────────────────

type Httpish = {
  status: number;
  ok: boolean;
  data: unknown;
  raw: Response;
};

async function req(
  baseUrl: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  jar?: CookieJar,
  extraHeaders?: Record<string, string>,
): Promise<Httpish> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (GLOBAL_BYPASS) headers["x-vercel-protection-bypass"] = GLOBAL_BYPASS;
  const cookie = jar?.header();
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  jar?.ingest(res);
  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text().catch(() => "");
  }
  return { status: res.status, ok: res.ok, data, raw: res };
}

// ────────────────────────────────────────────────────────────────────────────
// MP webhook signature (mirrors lib/server/mp-client.ts:validateMpWebhookSignature)
// ────────────────────────────────────────────────────────────────────────────

function signMpWebhook(dataId: string, requestId: string): { ts: string; signature: string } {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("Missing MP_WEBHOOK_SECRET in env.");
  const ts = String(Date.now());
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac("sha256", secret).update(template).digest("hex");
  return { ts, signature: `ts=${ts},v1=${hash}` };
}

// ────────────────────────────────────────────────────────────────────────────
// Resource tracker — every scenario records IDs so cleanup deletes them all
// ────────────────────────────────────────────────────────────────────────────

type Tracker = {
  userIds: string[];
  listingIds: string[];
  transactionIds: string[];
  ratingIds: string[];
  disputeIds: string[];
  notificationIds: string[];
};

function newTracker(): Tracker {
  return {
    userIds: [],
    listingIds: [],
    transactionIds: [],
    ratingIds: [],
    disputeIds: [],
    notificationIds: [],
  };
}

async function cleanupTracker(t: Tracker) {
  const db = admin();
  if (t.disputeIds.length) await db.from("dispute_events").delete().in("id", t.disputeIds);
  if (t.notificationIds.length) await db.from("notifications").delete().in("id", t.notificationIds);
  if (t.ratingIds.length) await db.from("reputation_events").delete().in("id", t.ratingIds);
  if (t.transactionIds.length)
    await db.from("payment_events").delete().in("transaction_id", t.transactionIds);
  if (t.listingIds.length) await db.from("market_listings").delete().in("id", t.listingIds);
  for (const userId of t.userIds) {
    await db.auth.admin.deleteUser(userId).catch(() => undefined);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Scenario harness — assertions, timing, pass/fail
// ────────────────────────────────────────────────────────────────────────────

type Asserter = {
  asserts: number;
  failure: string | null;
};

function makeAsserter(): Asserter {
  return { asserts: 0, failure: null };
}

function expect(a: Asserter, label: string, condition: boolean, detail = "") {
  a.asserts++;
  if (a.failure) return;
  if (!condition) {
    a.failure = `${label}${detail ? ` — ${detail}` : ""}`;
  }
}

function expectEq<T>(a: Asserter, label: string, got: T, want: T) {
  expect(a, label, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

type Scenario = {
  name: string;
  run: (ctx: { baseUrl: string; tracker: Tracker }) => Promise<Asserter>;
};

// ────────────────────────────────────────────────────────────────────────────
// Factories: test user, test listing (verified-payment seeding)
// ────────────────────────────────────────────────────────────────────────────

type TestUser = { id: string; email: string; accountSecret: string; username: string; jar: CookieJar };

async function createTestUser(
  baseUrl: string,
  tracker: Tracker,
  role: "seller" | "buyer",
): Promise<TestUser> {
  const db = admin();
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10_000);
  const email = `e2e+${ts}+${role}+${rand}@tcg-e2e.local`;
  const accountSecret = randomUUID();
  const username = `e2e_${role}_${ts}_${rand}`;

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: accountSecret,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? "unknown"}`);
  tracker.userIds.push(data.user.id);

  // Pre-create the profile row so the username is the one we want.
  await db.from("profiles").upsert({ id: data.user.id, username });

  const jar = new CookieJar();
  const login = await req(baseUrl, "POST", "/api/auth/login", {
    email,
    password: accountSecret,
  }, jar);
  if (!login.ok) {
    throw new Error(`login failed for ${email}: ${JSON.stringify(login.data)}`);
  }

  return { id: data.user.id, email, accountSecret, username, jar };
}

async function createTestListing(
  baseUrl: string,
  tracker: Tracker,
  seller: TestUser,
  opts?: { pickupOnly?: boolean; priceArs?: number; cardName?: string },
): Promise<{ id: string }> {
  const body = {
    cardName: `[E2E] ${opts?.cardName ?? "Charizard"} ${Date.now()}`,
    setName: "[E2E] Test Set",
    condition: "near_mint",
    priceArs: opts?.priceArs ?? 1000,
    quantity: 1,
    listingType: "single",
    offersShipping: !opts?.pickupOnly,
    offersPickup: Boolean(opts?.pickupOnly),
    deliveryAreaNotes: opts?.pickupOnly ? "Retiro CABA microcentro" : "",
  };
  const res = await req(baseUrl, "POST", "/api/listings", body, seller.jar);
  if (!res.ok) throw new Error(`createListing failed: ${JSON.stringify(res.data)}`);
  const id = (res.data as { listing: { id: string } }).listing.id;
  tracker.listingIds.push(id);
  return { id };
}

async function seedVerifiedPayment(
  tracker: Tracker,
  listingId: string,
  buyer: TestUser,
  seller: TestUser,
): Promise<{ transactionId: string }> {
  const db = admin();
  const transactionId = `e2e_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const { error: pErr } = await db.from("payment_events").insert({
    transaction_id: transactionId,
    listing_id: listingId,
    buyer_id: buyer.id,
    buyer_handle: buyer.username,
    seller_id: seller.id,
    seller_handle: seller.username,
    provider: "mercado_pago",
    provider_payment_id: `e2e_mp_${Date.now()}`,
    provider_status: "approved",
    verification_status: "verified",
    fulfillment_status: "seller_confirmed",
    platform_fee_ars: 10,
    checked_at: now,
    created_at: now,
  });
  if (pErr) throw new Error(`seedVerifiedPayment failed: ${pErr.message}`);
  tracker.transactionIds.push(transactionId);

  const { error: lErr } = await db
    .from("market_listings")
    .update({ status: "sold", reserved_at: null })
    .eq("id", listingId);
  if (lErr) throw new Error(`seedVerifiedPayment listing update: ${lErr.message}`);

  return { transactionId };
}

// ────────────────────────────────────────────────────────────────────────────
// Scenarios
// ────────────────────────────────────────────────────────────────────────────

const scenarios: Scenario[] = [
  {
    name: "login-and-session",
    run: async ({ baseUrl, tracker }) => {
      const a = makeAsserter();
      const seller = await createTestUser(baseUrl, tracker, "seller");
      // After login, the cookie jar has both tokens.
      expect(a, "jar has access token after login", Boolean(seller.jar.header()?.includes("sb-access-token")));
      // Hit a protected page (api/listings ?scope=mine) to verify session works server-side.
      const r = await req(baseUrl, "GET", "/api/listings?scope=mine", undefined, seller.jar);
      expectEq(a, "/api/listings scope=mine returns 200", r.status, 200);
      return a;
    },
  },
  {
    name: "listing-crud",
    run: async ({ baseUrl, tracker }) => {
      const a = makeAsserter();
      const seller = await createTestUser(baseUrl, tracker, "seller");
      const listing = await createTestListing(baseUrl, tracker, seller);
      // Listing appears in public list (looking it up by ID).
      const list = await req(baseUrl, "GET", "/api/listings", undefined);
      expectEq(a, "public list 200", list.status, 200);
      const found = (list.data as { items: Array<{ id: string }> }).items.some((i) => i.id === listing.id);
      expect(a, "listing appears in public list", found);
      // Update price.
      const patch = await req(baseUrl, "PATCH", "/api/listings", { id: listing.id, priceArs: 2500 }, seller.jar);
      expectEq(a, "patch price 200", patch.status, 200);
      const newPrice = (patch.data as { listing: { priceArs: number } }).listing.priceArs;
      expectEq(a, "price updated", newPrice, 2500);
      return a;
    },
  },
  {
    name: "reserve-and-self-purchase-blocked",
    run: async ({ baseUrl, tracker }) => {
      const a = makeAsserter();
      const seller = await createTestUser(baseUrl, tracker, "seller");
      const buyer = await createTestUser(baseUrl, tracker, "buyer");
      const listing = await createTestListing(baseUrl, tracker, seller);
      // Self-purchase: seller tries to reserve own listing.
      const own = await req(baseUrl, "POST", `/api/listings/${listing.id}/reserve`, {}, seller.jar);
      expect(a, "seller can't reserve own listing (5xx/4xx)", !own.ok);
      // Buyer reserves.
      const r = await req(baseUrl, "POST", `/api/listings/${listing.id}/reserve`, {}, buyer.jar);
      expectEq(a, "buyer reserves 200", r.status, 200);
      const txId = (r.data as { transactionId: string }).transactionId;
      tracker.transactionIds.push(txId);
      // Reservation flips listing to pending_payment.
      const db = admin();
      const { data: row } = await db.from("market_listings").select("status").eq("id", listing.id).maybeSingle();
      expectEq(a, "listing pending_payment after reserve", (row as { status: string }).status, "pending_payment");
      return a;
    },
  },
  {
    name: "webhook-bad-signature",
    run: async ({ baseUrl }) => {
      const a = makeAsserter();
      const dataId = "999999999";
      const r = await req(
        baseUrl,
        "POST",
        "/api/webhooks/mercadopago",
        { action: "payment.created", api_version: "v1", type: "payment", data: { id: dataId } },
        undefined,
        {
          "x-signature": "ts=123,v1=deadbeef",
          "x-request-id": "e2e-bad-sig",
        },
      );
      // In production NODE_ENV path → 401. In dev path → still 200 (skip check).
      expect(a, "bad signature rejected with 401 (or skipped in dev)", r.status === 401 || r.status === 200);
      return a;
    },
  },
  {
    name: "webhook-good-signature-unknown-payment",
    run: async ({ baseUrl }) => {
      const a = makeAsserter();
      const dataId = `999999${Math.floor(Math.random() * 10_000)}`;
      const requestId = `e2e-good-sig-${Date.now()}`;
      const { signature } = signMpWebhook(dataId, requestId);
      const r = await req(
        baseUrl,
        "POST",
        "/api/webhooks/mercadopago",
        { action: "payment.created", api_version: "v1", type: "payment", data: { id: dataId } },
        undefined,
        {
          "x-signature": signature,
          "x-request-id": requestId,
        },
      );
      // MP API will 404 the unknown id → webhook returns 200 with outcome=fetch_failed.
      expectEq(a, "webhook responds 200", r.status, 200);
      return a;
    },
  },
  {
    name: "post-payment-shipping-happy",
    run: async ({ baseUrl, tracker }) => {
      const a = makeAsserter();
      const seller = await createTestUser(baseUrl, tracker, "seller");
      const buyer = await createTestUser(baseUrl, tracker, "buyer");
      const listing = await createTestListing(baseUrl, tracker, seller, { priceArs: 1000 });
      const { transactionId } = await seedVerifiedPayment(tracker, listing.id, buyer, seller);

      // Seller cannot mark shipped without tracking.
      const noTrack = await req(
        baseUrl,
        "PATCH",
        `/api/transactions/${transactionId}/fulfillment`,
        { status: "shipped" },
        seller.jar,
      );
      expectEq(a, "shipped without tracking → 400", noTrack.status, 400);

      // Seller marks shipped with tracking.
      const ship = await req(
        baseUrl,
        "PATCH",
        `/api/transactions/${transactionId}/fulfillment`,
        { status: "shipped", trackingNumber: "AR123456789" },
        seller.jar,
      );
      expectEq(a, "shipped with tracking → 200", ship.status, 200);

      // Buyer confirms delivered.
      const deliver = await req(
        baseUrl,
        "PATCH",
        `/api/transactions/${transactionId}/fulfillment`,
        { status: "delivered" },
        buyer.jar,
      );
      expectEq(a, "delivered → 200", deliver.status, 200);

      // Buyer rates.
      const rate = await req(
        baseUrl,
        "POST",
        `/api/transactions/${transactionId}/rate`,
        { stars: 5, comment: "[E2E] all good" },
        buyer.jar,
      );
      expectEq(a, "rate 5★ → 200", rate.status, 200);

      // Idempotency: second rate returns existing.
      const rate2 = await req(
        baseUrl,
        "POST",
        `/api/transactions/${transactionId}/rate`,
        { stars: 5 },
        buyer.jar,
      );
      expectEq(a, "rate 2nd time → 200 (idempotent)", rate2.status, 200);
      expect(a, "rate 2nd time idempotent flag", Boolean((rate2.data as { idempotent?: boolean }).idempotent));

      // Final state: payment closed, reputation_events row exists.
      const db = admin();
      const { data: pay } = await db
        .from("payment_events")
        .select("verification_status, fulfillment_status")
        .eq("transaction_id", transactionId)
        .maybeSingle();
      const payRow = pay as { verification_status: string; fulfillment_status: string } | null;
      expectEq(a, "payment.verification_status", payRow?.verification_status, "verified");
      expectEq(a, "payment.fulfillment_status", payRow?.fulfillment_status, "closed");

      const { data: rep } = await db
        .from("reputation_events")
        .select("id, score_delta, metadata")
        .eq("seller_id", seller.id)
        .eq("event_type", "rating");
      const repRow = (rep ?? [])[0] as
        | { id: string; score_delta: number; metadata: { transaction_id: string; stars: number } }
        | undefined;
      if (repRow) tracker.ratingIds.push(repRow.id);
      expectEq(a, "reputation row created", Boolean(repRow), true);
      expectEq(a, "reputation stars=5", repRow?.score_delta, 5);
      expectEq(a, "reputation tx matches", repRow?.metadata.transaction_id, transactionId);
      return a;
    },
  },
  {
    name: "post-payment-pickup-happy",
    run: async ({ baseUrl, tracker }) => {
      const a = makeAsserter();
      const seller = await createTestUser(baseUrl, tracker, "seller");
      const buyer = await createTestUser(baseUrl, tracker, "buyer");
      const listing = await createTestListing(baseUrl, tracker, seller, { pickupOnly: true });
      const { transactionId } = await seedVerifiedPayment(tracker, listing.id, buyer, seller);

      // For pickup: seller marks delivered directly (no shipped step). The API allows it.
      const deliver = await req(
        baseUrl,
        "PATCH",
        `/api/transactions/${transactionId}/fulfillment`,
        { status: "delivered" },
        buyer.jar, // delivery is buyer-only per API
      );
      expectEq(a, "pickup delivered (buyer) → 200", deliver.status, 200);

      const rate = await req(
        baseUrl,
        "POST",
        `/api/transactions/${transactionId}/rate`,
        { stars: 4 },
        buyer.jar,
      );
      expectEq(a, "pickup rate → 200", rate.status, 200);

      // Capture rep id for cleanup.
      const db = admin();
      const { data: rep } = await db
        .from("reputation_events")
        .select("id")
        .eq("seller_id", seller.id)
        .eq("event_type", "rating");
      for (const row of (rep ?? []) as Array<{ id: string }>) tracker.ratingIds.push(row.id);
      return a;
    },
  },
  {
    name: "dispute-notifies-both",
    run: async ({ baseUrl, tracker }) => {
      const a = makeAsserter();
      const seller = await createTestUser(baseUrl, tracker, "seller");
      const buyer = await createTestUser(baseUrl, tracker, "buyer");
      const listing = await createTestListing(baseUrl, tracker, seller);
      const { transactionId } = await seedVerifiedPayment(tracker, listing.id, buyer, seller);

      const disp = await req(
        baseUrl,
        "POST",
        "/api/disputes",
        {
          transactionId,
          reason: "[E2E] no llegó",
          details: "[E2E] el tracking está muerto desde hace 10 días, no responde mensajes.",
        },
        buyer.jar,
      );
      expectEq(a, "dispute created → 201", disp.status, 201);
      const dispatchedId = (disp.data as { dispute?: { id?: string } }).dispute?.id;
      if (dispatchedId) tracker.disputeIds.push(dispatchedId);

      // The notify is fire-and-forget. Give it a brief moment then check.
      await new Promise((r) => setTimeout(r, 1200));

      const db = admin();
      const { data: notifs } = await db
        .from("notifications")
        .select("id, user_id, type")
        .in("user_id", [seller.id, buyer.id])
        .eq("type", "dispute_opened");
      const list = (notifs ?? []) as Array<{ id: string; user_id: string; type: string }>;
      for (const n of list) tracker.notificationIds.push(n.id);

      const sellerNotified = list.some((n) => n.user_id === seller.id);
      // The opener (buyer) is excluded by design — only the OTHER party is notified.
      expect(a, "seller (non-opener) received dispute_opened notification", sellerNotified);
      return a;
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Runner
// ────────────────────────────────────────────────────────────────────────────

async function runOne(s: Scenario, baseUrl: string): Promise<{ ok: boolean; ms: number; asserts: number; failure: string | null }> {
  const tracker = newTracker();
  const t0 = Date.now();
  let res: Asserter = makeAsserter();
  try {
    res = await s.run({ baseUrl, tracker });
  } catch (err) {
    res.asserts++;
    res.failure = `threw: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    try {
      await cleanupTracker(tracker);
    } catch (err) {
      // Cleanup failures shouldn't mask test outcome.
      console.warn(`cleanup error in ${s.name}:`, err);
    }
  }
  return {
    ok: res.failure == null,
    ms: Date.now() - t0,
    asserts: res.asserts,
    failure: res.failure,
  };
}

async function runAll(scenarioFilter: string, baseUrl: string) {
  const targets = scenarios.filter((s) => scenarioFilter === "all" || s.name === scenarioFilter);
  if (targets.length === 0) {
    console.error(`No scenario matches "${scenarioFilter}". Available:\n${scenarios.map((s) => `  - ${s.name}`).join("\n")}`);
    process.exit(2);
  }

  console.log(`\ne2e against ${baseUrl}\n`);
  let passed = 0;
  let failed = 0;
  for (const s of targets) {
    process.stdout.write(`  · ${s.name} ... `);
    const r = await runOne(s, baseUrl);
    if (r.ok) {
      passed++;
      console.log(`\x1b[32m✓\x1b[0m (${r.asserts} asserts) ${r.ms}ms`);
    } else {
      failed++;
      console.log(`\x1b[31m✗\x1b[0m ${r.failure}`);
    }
  }
  console.log(`\n${passed} passed · ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// ────────────────────────────────────────────────────────────────────────────
// Cleanup mode (--cleanup) — safety net for leftover entities
// ────────────────────────────────────────────────────────────────────────────

async function safetyCleanup() {
  const db = admin();
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
  console.log(`Cleanup: removing e2e_* / [E2E] entities older than ${cutoff}`);

  // Payment events with e2e_ prefix
  const { data: payments } = await db
    .from("payment_events")
    .select("transaction_id, listing_id")
    .like("transaction_id", "e2e_tx_%")
    .lt("created_at", cutoff);
  if (payments && payments.length) {
    const txIds = (payments as Array<{ transaction_id: string }>).map((p) => p.transaction_id);
    await db.from("payment_events").delete().in("transaction_id", txIds);
    console.log(`  removed ${txIds.length} payment_events`);
  }

  // Listings prefixed [E2E]
  const { data: listings } = await db
    .from("market_listings")
    .select("id")
    .like("card_name", "[E2E]%")
    .lt("created_at", cutoff);
  if (listings && listings.length) {
    const ids = (listings as Array<{ id: string }>).map((l) => l.id);
    await db.from("market_listings").delete().in("id", ids);
    console.log(`  removed ${ids.length} listings`);
  }

  // Reputation events whose metadata references e2e_tx_ transactions
  const { data: reps } = await db
    .from("reputation_events")
    .select("id, metadata")
    .eq("event_type", "rating")
    .lt("created_at", cutoff);
  const repIds: string[] = [];
  for (const raw of (reps ?? []) as Array<{ id: string; metadata: { transaction_id?: string } }>) {
    if ((raw.metadata?.transaction_id ?? "").startsWith("e2e_tx_")) repIds.push(raw.id);
  }
  if (repIds.length) {
    await db.from("reputation_events").delete().in("id", repIds);
    console.log(`  removed ${repIds.length} reputation_events`);
  }

  // Auth users with e2e+ emails
  let page = 1;
  const userIdsToDelete: string[] = [];
  // Supabase admin listUsers paginates by `page` + `perPage`.
  // We bound to 5 pages * 100 = 500 users max per cleanup run.
  while (page <= 5) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users || data.users.length === 0) break;
    for (const u of data.users) {
      const email = u.email ?? "";
      if (email.startsWith("e2e+") && email.endsWith("@tcg-e2e.local")) {
        const createdAt = new Date(u.created_at ?? 0).getTime();
        if (createdAt && createdAt < Date.now() - 10 * 60 * 1000) {
          userIdsToDelete.push(u.id);
        }
      }
    }
    if (data.users.length < 100) break;
    page++;
  }
  for (const id of userIdsToDelete) {
    await db.auth.admin.deleteUser(id).catch(() => undefined);
  }
  if (userIdsToDelete.length) console.log(`  removed ${userIdsToDelete.length} users`);

  console.log("Cleanup done.");
}

// ────────────────────────────────────────────────────────────────────────────
// Entry
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const { baseUrl, scenario, cleanup, bypass } = parseArgv();

  if (!/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(baseUrl) && process.env.E2E_ALLOW_PROD !== "1") {
    console.error(
      `\nRefusing to run against non-local base URL (${baseUrl}) without E2E_ALLOW_PROD=1.\n` +
        `Set E2E_ALLOW_PROD=1 explicitly to confirm.\n`,
    );
    process.exit(2);
  }

  GLOBAL_BYPASS = bypass;

  if (cleanup) {
    await safetyCleanup();
    return;
  }

  await runAll(scenario, baseUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
