/**
 * Resolve the public base URL for the app.
 *
 * Resolution order:
 *   1. APP_URL              — explicit override (server-only env var).
 *   2. NEXT_PUBLIC_APP_URL  — same value if exposed to the client build.
 *   3. VERCEL_PROJECT_PRODUCTION_URL — Vercel auto-injects this on every
 *      deployment with the project's stable production hostname (no scheme).
 *   4. VERCEL_URL           — the per-deployment hostname (preview / prod).
 *   5. http://localhost:3000 — local dev fallback.
 *
 * Always returns a normalized URL without a trailing slash.
 */
export function getAppUrl(): string {
  const explicit =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return stripTrailingSlash(ensureScheme(explicit));

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) return `https://${stripTrailingSlash(vercelProd)}`;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  return "http://localhost:3000";
}

function ensureScheme(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
