/**
 * Validates a post-login redirect taken from the query string: only same-site
 * absolute paths ("/market/123"), never protocol-relative ("//evil.com") or
 * backslash tricks that browsers treat as another host.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
