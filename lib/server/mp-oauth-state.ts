export const MP_OAUTH_STATE_COOKIE = "mp_oauth_state";
export const MP_OAUTH_RETURN_COOKIE = "mp_oauth_return";

// Allowlist instead of "any relative path": the value comes from a query param.
const RETURN_PATHS = ["/account", "/onboarding", "/inventory"] as const;

export function safeMpReturnPath(value: string | null | undefined): string {
  return RETURN_PATHS.find((path) => path === value) ?? "/account";
}
