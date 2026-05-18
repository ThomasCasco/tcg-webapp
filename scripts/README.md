# E2E Test Harness

Single-file harness that drives the app via real HTTP + Supabase admin so you
can verify the buy / fulfillment / rating / dispute flows after any change.

## Usage

```bash
# All scenarios, default base http://localhost:3000 (start `npm run dev` first)
npm run e2e

# Single scenario
npm run e2e -- post-payment-shipping-happy

# Against production / a preview URL
E2E_ALLOW_PROD=1 npm run e2e -- \
  --base=https://tcg-webapp-thomascascos-projects.vercel.app all

# If the target has Vercel Deployment Protection (SSO), pass the bypass token:
E2E_ALLOW_PROD=1 VERCEL_PROTECTION_BYPASS=<token> npm run e2e -- \
  --base=https://<deployment>.vercel.app all
# or
npm run e2e -- --base=... --bypass=<token> all

# Safety net cleanup — removes any leftover e2e_* / [E2E] entities older than 10 min
npm run e2e:cleanup
```

## How to get the Vercel bypass token

Vercel Dashboard → Project → Settings → Deployment Protection →
**Protection Bypass for Automation** → generate a new secret. Then either:

- Set `VERCEL_PROTECTION_BYPASS=<secret>` in `.env.local`, or
- Pass `--bypass=<secret>` on each run.

The harness sends it as `x-vercel-protection-bypass: <secret>` on every
request so it skips the SSO wall.

## Available scenarios

| Name | What it asserts |
|---|---|
| `login-and-session` | Cookie jar after login, protected route reachable. |
| `listing-crud` | Create listing as seller, see it in public list, patch its price. |
| `reserve-and-self-purchase-blocked` | Seller can't reserve own listing; buyer reservation flips listing to `pending_payment`. |
| `webhook-bad-signature` | POST with `ts=…,v1=deadbeef` returns 401 in prod / 200 in dev. |
| `webhook-good-signature-unknown-payment` | HMAC-signed payload accepted; MP API 404 → webhook still 200. |
| `post-payment-shipping-happy` | seller-confirmed → shipped (requires tracking) → delivered → rate 5★ → closed; reputation row + idempotent re-rate. |
| `post-payment-pickup-happy` | pickup-only listing: buyer marks delivered, rates 4★, closes. |
| `dispute-notifies-both` | buyer opens dispute → seller receives `dispute_opened` notification (opener is excluded). |

## Required env

| Var | Why |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase admin client base. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-level operations: creating test users, seeding payment_events, cleanup. |
| `MP_WEBHOOK_SECRET` | HMAC signing for the webhook scenarios. |
| `E2E_ALLOW_PROD=1` | Required to target a non-localhost base URL. |
| `VERCEL_PROTECTION_BYPASS` | Optional — only if the target has Vercel SSO. |

## Isolation guarantees

- Every test user has email `e2e+<ts>+<role>+<rand>@tcg-e2e.local`.
- Every test listing has `card_name` prefixed with `[E2E]`.
- Every seeded transaction id is prefixed `e2e_tx_`.
- Each scenario tracks the IDs it created and deletes them in `finally`.
- `npm run e2e:cleanup` is the safety net — scans for leftover markers older
  than 10 minutes and removes them, in case a run hung.

## Limits

- The "MP payment verified" happy path is **seeded directly via Supabase admin**.
  We cannot actually pay through MP in an automated way without a real card and
  the MP sandbox flow. The scenario covers everything that runs *after* the
  payment is verified.
- `webhook-good-signature-unknown-payment` validates the HMAC + parser + the
  "MP API 404" path. Real reconcile against a real MP payment is not in scope
  for this harness — that's covered by the manual reconcile we did when bugs
  appeared in prod and by `/api/cron/reconcile-mp-payments`.
