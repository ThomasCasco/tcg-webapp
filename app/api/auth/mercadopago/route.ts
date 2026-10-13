/**
 * GET /api/auth/mercadopago
 *
 * Initiates the Mercado Pago OAuth flow for seller onboarding.
 * Redirects the authenticated seller to the MP authorization page.
 *
 * Query params: optional `return_to` (/account, /onboarding or /inventory) where the
 * seller lands after authorizing.
 * State param: random nonce stored in an httpOnly cookie.
 */

import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getMpAuthorizationUrl } from "@/lib/server/mp-client";
import {
  MP_OAUTH_RETURN_COOKIE,
  MP_OAUTH_STATE_COOKIE,
  safeMpReturnPath,
} from "@/lib/server/mp-oauth-state";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<Response> {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUri = mpRedirectUri(request);
  const state = crypto.randomUUID();

  try {
    const url = getMpAuthorizationUrl(state, redirectUri);
    const response = NextResponse.redirect(url);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 10 * 60,
    };
    response.cookies.set(MP_OAUTH_STATE_COOKIE, `${user.id}:${state}`, cookieOptions);
    response.cookies.set(
      MP_OAUTH_RETURN_COOKIE,
      safeMpReturnPath(new URL(request.url).searchParams.get("return_to")),
      cookieOptions,
    );
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "MP config error";
    return Response.json({ error: message }, { status: 500 });
  }
}

function mpRedirectUri(request: Request): string {
  const explicit = process.env.MP_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  // Derive from request origin (development fallback)
  const url = new URL(request.url);
  return `${url.origin}/api/auth/mercadopago/callback`;
}
