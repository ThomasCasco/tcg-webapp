/**
 * v0 launch scope: only direct sales of single cards through Mercado Pago.
 *
 * Auctions, claims, trades and the profile directory are frozen, not deleted:
 * proxy.ts redirects their pages to the market and answers 404 on their APIs.
 * Set ENABLE_SECONDARY_FORMATS=1 to turn them back on once they are ready
 * (auctions still need bid locking, anti-snipe and MP checkout; claims need
 * realtime and payment).
 */

const FROZEN_PAGE_PREFIXES = [
  "/auctions",
  "/my-auctions",
  "/claims",
  "/my-claims",
  "/trades",
  "/trade-proposals",
  "/profiles",
];

const FROZEN_API_PREFIXES = [
  "/api/auctions",
  "/api/claims",
  "/api/trade-proposals",
  "/api/cron/activate-scheduled-auctions",
];

const DEV_ONLY_PAGE_PREFIXES = ["/ui-kit"];

export function secondaryFormatsEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.ENABLE_SECONDARY_FORMATS === "1";
}

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** "page" → redirect to the market, "api" → 404, null → serve normally. */
export function frozenPathKind(
  path: string,
  env: Record<string, string | undefined> = process.env,
): "page" | "api" | null {
  if (env.NODE_ENV === "production" && matchesPrefix(path, DEV_ONLY_PAGE_PREFIXES)) {
    return "page";
  }
  if (secondaryFormatsEnabled(env)) return null;
  if (matchesPrefix(path, FROZEN_API_PREFIXES)) return "api";
  if (matchesPrefix(path, FROZEN_PAGE_PREFIXES)) return "page";
  return null;
}
