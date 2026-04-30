/**
 * GET /api/auth/mercadopago
 *
 * Initiates the Mercado Pago OAuth flow for seller onboarding.
 * Redirects the authenticated seller to the MP authorization page.
 *
 * Query params forwarded as-is: none.
 * State param: seller's user ID (used to verify callback).
 */

import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getMpAuthorizationUrl } from "@/lib/server/mp-client";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<Response> {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUri = mpRedirectUri(request);
  const state = user.id;

  try {
    const url = getMpAuthorizationUrl(state, redirectUri);
    return NextResponse.redirect(url);
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
