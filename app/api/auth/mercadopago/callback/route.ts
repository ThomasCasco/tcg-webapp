/**
 * GET /api/auth/mercadopago/callback
 *
 * OAuth callback from Mercado Pago.
 * Exchanges the authorization code for tokens and saves them.
 *
 * MP redirects here with:
 *   ?code=<auth_code>&state=<oauth_nonce>
 *
 * On error MP sends:
 *   ?error=<error_code>&error_description=<desc>
 */

import { exchangeMpCode } from "@/lib/server/mp-client";
import { saveMpCredentials } from "@/lib/server/mp-auth";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { log } from "@/lib/server/logger";
import { cookies } from "next/headers";
import { MP_OAUTH_STATE_COOKIE } from "@/lib/server/mp-oauth-state";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const { getAppUrl } = await import("@/lib/shared/app-url");
  const appUrl = getAppUrl();
  const accountUrl = `${appUrl}/account`;
  const errorUrl = `${appUrl}/account?mp_error=`;

  if (error) {
    log.warn("MP OAuth callback error", { error, errorDesc });
    return clearStateCookie(NextResponse.redirect(`${errorUrl}${encodeURIComponent(error)}`));
  }

  if (!code || !state) {
    return clearStateCookie(NextResponse.redirect(`${errorUrl}invalid_callback`));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(MP_OAUTH_STATE_COOKIE)?.value ?? "";
  const [expectedUserId, expectedNonce] = expectedState.split(":");

  const user = await getAuthenticatedUser().catch(() => null);
  if (!user || user.id !== expectedUserId || state !== expectedNonce) {
    log.warn("MP OAuth state mismatch", { state, userId: user?.id });
    return clearStateCookie(NextResponse.redirect(`${errorUrl}state_mismatch`));
  }

  const redirectUri = mpRedirectUri(request);

  try {
    const tokens = await exchangeMpCode(code, redirectUri);
    await saveMpCredentials({
      sellerId: user.id,
      mpUserId: tokens.mpUserId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      scope: tokens.scope,
      liveMode: tokens.liveMode,
    });

    log.info("Seller connected MP", { sellerId: user.id, mpUserId: tokens.mpUserId });
    return clearStateCookie(NextResponse.redirect(`${accountUrl}?mp_connected=1`));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("MP OAuth exchange failed", { sellerId: user.id, message });
    return clearStateCookie(
      NextResponse.redirect(`${errorUrl}${encodeURIComponent(message)}`),
    );
  }
}

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(MP_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}

function mpRedirectUri(request: Request): string {
  const explicit = process.env.MP_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const url = new URL(request.url);
  return `${url.origin}/api/auth/mercadopago/callback`;
}
