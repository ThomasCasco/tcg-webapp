/**
 * GET /api/auth/mercadopago/callback
 *
 * OAuth callback from Mercado Pago.
 * Exchanges the authorization code for tokens and saves them.
 *
 * MP redirects here with:
 *   ?code=<auth_code>&state=<seller_user_id>
 *
 * On error MP sends:
 *   ?error=<error_code>&error_description=<desc>
 */

import { exchangeMpCode } from "@/lib/server/mp-client";
import { saveMpCredentials } from "@/lib/server/mp-auth";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { log } from "@/lib/server/logger";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const appUrl = process.env.APP_URL ?? "";
  const accountUrl = `${appUrl}/account`;
  const errorUrl = `${appUrl}/account?mp_error=`;

  if (error) {
    log.warn("MP OAuth callback error", { error, errorDesc });
    return NextResponse.redirect(`${errorUrl}${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${errorUrl}invalid_callback`);
  }

  // Verify the authenticated user matches the state (CSRF check)
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user || user.id !== state) {
    log.warn("MP OAuth state mismatch", { state, userId: user?.id });
    return NextResponse.redirect(`${errorUrl}state_mismatch`);
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
    return NextResponse.redirect(`${accountUrl}?mp_connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("MP OAuth exchange failed", { sellerId: user.id, message });
    return NextResponse.redirect(`${errorUrl}${encodeURIComponent(message)}`);
  }
}

function mpRedirectUri(request: Request): string {
  const explicit = process.env.MP_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const url = new URL(request.url);
  return `${url.origin}/api/auth/mercadopago/callback`;
}
