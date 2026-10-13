# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack

- **Next.js 16.2** (App Router) on **React 19.2** — APIs and conventions differ from earlier Next/React. See `AGENTS.md`.
- TypeScript (strict), Tailwind v4, ESLint 9 flat config (`eslint-config-next`).
- Supabase (Postgres + Auth + Storage) as the only persistent backend.
- Mercado Pago (OAuth marketplace flow) as the only payment provider.
- Vitest + jsdom + Testing Library for unit/component tests; a custom HTTP harness in `scripts/e2e.ts` for end-to-end.
- Sentry for error reporting (`instrumentation.ts` wires it up only when `NEXT_PUBLIC_SENTRY_DSN` is set).
- Deploys to Vercel; CI runs lint + typecheck + test + build on every PR (`.github/workflows/ci.yml`).

## Commands

```bash
npm run dev          # next dev
npm run build        # next build
npm run start        # next start
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (all tests)
npm run test -- tests/lib/server/auth.test.ts   # single file
npm run test -- -t "verifyAccessToken"          # by test name
npm run e2e          # HTTP-driven scenarios against http://localhost:3000 (start dev first)
npm run e2e -- post-payment-shipping-happy      # single scenario; see scripts/README.md
npm run e2e:cleanup  # remove leftover e2e_* / [E2E] rows older than 10 min
```

E2E targets that are non-localhost require `E2E_ALLOW_PROD=1` and may need `VERCEL_PROTECTION_BYPASS` for SSO-protected previews.

## Repository-specific conventions

- **Middleware lives in `proxy.ts` at the repo root**, not `middleware.ts`. The exported function is `proxy` (not `middleware`). Editing this file changes auth-cookie refresh and protected-route redirects for every request.
- Path alias `@/*` → repo root (configured in `tsconfig.json` and mirrored in `vitest.config.ts`).
- Route groups under `app/`:
  - `(auth)` — `/login`, `/register`, `/forgot-password`, `/reset-password` (their own header/layout).
  - `(dashboard)` — protected pages; layout calls `getAuthenticatedUser()` and redirects to `/login` when missing.
  - `(public)` — marketing + market browsing; layout is auth-aware but never gates.
  - `(dev)` — `/ui-kit`, dev-only previews.
- UI text is **Spanish (es-AR)**; domain values (`ListingStatus`, `FulfillmentStatus`, etc.) are English. Don't translate string unions or DB column names when adding new code.
- Currency is ARS throughout (`priceArs`, `platformFeeArs`, `unitPriceArs`). There is no multi-currency layer.

## Architecture

### Auth (custom cookie session, not `@supabase/ssr`)

- `proxy.ts` runs on every request, reads `tcg_access_token` / `tcg_refresh_token` (httpOnly cookies — names in `lib/shared/auth-cookies.ts`), and refreshes the Supabase session itself when the access JWT is within 60s of expiry. Three outcomes: `refreshed` (rewrites both cookies on the response and on the in-flight request so RSCs see them), `invalid_grant` (wipes cookies), `failed` (transient — keeps cookies so the next request retries).
- `proxy.ts` also handles the protected-path redirect (`/inventory`, `/listings`, `/transactions`, `/disputes`, `/alerts`, `/account`, `/dashboard`, `/onboarding` → `/login?next=…`; the login page honours `next` through `lib/shared/safe-next.ts`) and the inverse for `/login` and `/register` when already signed in.
- `proxy.ts` first checks `lib/shared/features.ts`: auctions, claims, trades and `/profiles` are frozen for v0 (pages redirect to `/market`, their APIs answer 404) unless `ENABLE_SECONDARY_FORMATS=1`. `/ui-kit` is hidden in production.
- `lib/server/auth.ts` is the **server-side** auth entry. `verifyAccessToken` checks the JWT signature with `supabase.auth.getClaims()`: ES256 tokens are verified locally against the project's cached JWKS (no network per request); anything else falls back to the Auth server and fails closed. Never decode the cookie without verifying it — httpOnly stops scripts from reading the cookie, not users from forging one. Route handlers don't need to re-validate; call `getAuthenticatedUser()` / `requireAuthenticatedUser()`.
- `getAuthenticatedUser()` returns `null` on missing/expired tokens (UI shows logged-out). `requireAuthenticatedUser()` throws — handlers usually do `.catch(() => null)` and return 401 themselves.

### Supabase clients

- `lib/server/supabase.ts` exposes a singleton **service-role** admin client (`getSupabaseAdminClient`) and an anon client. Never import or instantiate these outside `lib/server/` or `app/api/` — leaking the service-role key into a client bundle is the failure mode `runbook/rotate-supabase-keys.md` is written against.
- All database I/O is funnelled through `lib/server/repository.ts` — one large module that owns table names (`INVENTORY_TABLE`, `LISTINGS_TABLE`, …), row-to-domain mappers, and all CRUD. Add new tables here rather than calling `from(...)` in route handlers.

### Database migrations

- Greenfield install: run `supabase/schema.sql` first, then **every** `supabase/migrate-v*.sql` in numeric order (currently up to v15), then `supabase/migrations/` (timestamp prefixes, Supabase CLI format). `20261013000001_v0_lockdown.sql` must run **last**: it enables RLS on every public table and drops all policies, because the app only talks to Postgres through the service role. Don't add RLS policies for the anon key; expose data through route handlers instead.
- When adding schema: add a new `migrate-vN.sql` (or a timestamped file under `migrations/`), and update `supabase/schema.sql` so fresh projects don't need every migration replayed.

### Payments (Mercado Pago, no escrow)

Read `PAYMENTS.md` before touching payment code. Design constraint: **the platform never custodies funds.** That keeps the project out of BCRA / PSP territory in Argentina.

- OAuth: `app/api/auth/mercadopago/*` connects a seller's MP account. Tokens stored per-seller; refreshed by `app/api/cron/refresh-mp-tokens`.
- Checkout: `POST /api/payments/checkout` creates an MP preference **in the seller's account**, with `binary_mode` and an expiry of `CHECKOUT_WINDOW_MINUTES` (`lib/shared/reservations.ts`). Buyer pays seller directly. Mercado Pago is mandatory: there is no alias/CBU path (`/api/listings/:id/reserve` answers 410) and publishing requires a connected MP account.
- Commission: `lib/shared/platform-fee.ts` is the only source (`PLATFORM_FEE_PERCENT`, `PLATFORM_FEE_MIN_ARS`, default 0). Server code reads the config; client components get it as props. Show the stored `platform_fee_ars`, never a recomputation.
- Reservations last `RESERVATION_TTL_MINUTES` (checkout window + grace). Expiry is lazy: `mapListingRow` shows expired reservations as `active` and `reserveListing` accepts them, so nothing depends on the daily cron.
- Webhook: `POST /api/webhooks/mercadopago` validates HMAC with `MP_WEBHOOK_SECRET` (mandatory in prod; permissive in dev), fetches the payment from MP, and calls into `lib/server/mp-reconcile.ts` to flip transaction + listing state.
- Safety nets if the webhook is lost: success-redirect re-verifies, plus `app/api/cron/reconcile-mp-payments` and `app/api/cron/daily`. `POST /api/admin/payments/manual-verify` (guarded by `ADMIN_SECRET`) is the manual fallback. Never trust a payment id sent by a buyer: verification goes through `reconcileMpTransaction` (amount, currency, collector checks).
- `verifyTransaction` is idempotent and settles the listing once: one unit off the stock (back to `active` if any is left, else `sold`); a payment for a listing already sold/cancelled notifies both parties (`sale_conflict`).
- `lib/server/mp-client.ts` uses raw `fetch` (no SDK) and distinguishes per-seller tokens from `MP_ACCESS_TOKEN` (platform).

### Transaction lifecycle

`pending` → `seller_confirmed` (payment verified) → `shipped` (seller; tracking required for shipping, "handed over" for pickup) → `delivered` (buyer) → `closed` (after buyer rating). `disputed` comes only from `POST /api/disputes` on a verified, open transaction. Allowed transitions live in `lib/domain/fulfillment.ts` and are enforced in `updateFulfillmentStatus` (`FulfillmentTransitionError` → 409); `PATCH /api/transactions/:id/fulfillment` only accepts `shipped` and `delivered`. Buyers can cancel an unpaid reservation with `POST /api/transactions/:id/cancel`. `lib/server/transaction-context.ts` is the single helper that loads buyer/seller/listing/payment together for emails and notifications — use it instead of re-querying.

### Cron endpoints

All under `app/api/cron/*`, gated by `Authorization: Bearer ${CRON_SECRET}`. Only `/api/cron/daily` is wired to Vercel Cron (`vercel.json`); the rest are invoked manually or by external schedulers.

### Boot-time env validation

`instrumentation.ts` runs `lib/server/env-validate.ts` on Node startup. Missing required env vars **throw and block boot in production**; in dev they log and continue. When adding a new env var that must exist in prod, register it in one of the `groups` there rather than failing later at request time.

### Rate limiting

`lib/server/rate-limit.ts` is an **in-memory** bucket per process — fine for Vercel's per-region warm functions, useless across regions or cold starts. Treat it as best-effort throttling, not security.

### Security headers / CSP

`next.config.ts` sets the CSP. Any new third-party origin (image host, payment SDK, analytics) needs an explicit entry — there is no wildcard `default-src`.

### Logging

`lib/server/logger.ts` emits one JSON line per call to stdout (Vercel ingests this). Always include a context object with `requestId` when in a request path (proxy seeds `x-request-id`). Don't use `console.*` directly in new code.

## Testing notes

- Vitest config uses jsdom and loads `tests/setup.ts` (jest-dom matchers). Tests live mirroring source under `tests/lib/...` and `tests/components/...`.
- The e2e harness (`scripts/e2e.ts`) creates isolated rows tagged `e2e_*` / `[E2E]` and cleans up in `finally`. Never reuse those prefixes for real fixtures or seed data, or `npm run e2e:cleanup` will delete them.

## Things to avoid

- Don't rename `proxy.ts` to `middleware.ts` — Next 16 looks for `proxy.ts` here.
- Don't import `@/lib/server/*` from a `"use client"` component or a file under `app/` that ships to the browser.
- Don't add a new route handler that queries Supabase directly; route through `lib/server/repository.ts`.
- Don't introduce a payments code path that holds buyer funds before forwarding to the seller — see `PAYMENTS.md` for the legal rationale.
