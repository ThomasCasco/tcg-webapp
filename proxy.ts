import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient, type Session } from "@supabase/supabase-js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/shared/auth-cookies";

const protectedPaths = ["/inventory", "/listings", "/transactions", "/disputes", "/alerts"];
const authPaths = ["/login", "/register"];

type RefreshOutcome =
  | { kind: "refreshed"; session: Session }
  | { kind: "invalid_grant" }
  | { kind: "failed" }
  | { kind: "skipped" };

// Refresh proactively if the JWT expires within this window (seconds).
const REFRESH_LEEWAY_SECONDS = 60;

function jwtNeedsRefresh(accessToken: string | undefined): boolean {
  if (!accessToken) return false;
  try {
    const payloadB64 = accessToken.split(".")[1];
    if (!payloadB64) return true;
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8"),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp - nowSec <= REFRESH_LEEWAY_SECONDS;
  } catch {
    // Unreadable token → safer to try refresh.
    return true;
  }
}

async function tryRefreshSession(request: NextRequest): Promise<RefreshOutcome> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return { kind: "skipped" };
  }

  // Skip only when we have an access token that is still comfortably valid.
  if (accessToken && !jwtNeedsRefresh(accessToken)) {
    return { kind: "skipped" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { kind: "skipped" };

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      // Distinguish "the refresh token is no good anymore" from transient
      // failures (network, parallel-refresh race that already rotated the
      // token). Only the former should force a re-login.
      const message = (error?.message ?? "").toLowerCase();
      const invalidGrant =
        message.includes("invalid") ||
        message.includes("revoked") ||
        message.includes("expired") ||
        message.includes("not found");
      return invalidGrant ? { kind: "invalid_grant" } : { kind: "failed" };
    }
    return { kind: "refreshed", session: data.session };
  } catch {
    return { kind: "failed" };
  }
}

function persistRefreshedSession(response: NextResponse, session: Session) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: session.expires_in ?? 60 * 60,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function clearRefreshCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function proxy(request: NextRequest) {
  // Propagate / generate request-ID for structured logging
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const path = request.nextUrl.pathname;

  const refresh = await tryRefreshSession(request);
  if (refresh.kind === "refreshed") {
    // make downstream Server Components see the new tokens
    request.cookies.set(ACCESS_TOKEN_COOKIE, refresh.session.access_token);
    request.cookies.set(REFRESH_TOKEN_COOKIE, refresh.session.refresh_token);
  } else if (refresh.kind === "invalid_grant") {
    // Refresh token is dead: drop the access cookie from this request too so
    // the protected-path redirect below fires correctly.
    request.cookies.delete(ACCESS_TOKEN_COOKIE);
    request.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  let response: NextResponse;

  if (protectedPaths.some((protectedPath) => path.startsWith(protectedPath)) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    response = NextResponse.redirect(loginUrl);
  } else if (authPaths.some((authPath) => path.startsWith(authPath)) && hasSession) {
    response = NextResponse.redirect(new URL("/inventory", request.url));
  } else {
    response = NextResponse.next({ request });
  }

  if (refresh.kind === "refreshed") {
    persistRefreshedSession(response, refresh.session);
  } else if (refresh.kind === "invalid_grant") {
    // Only wipe cookies when the refresh token is provably dead.
    // Transient failures keep the cookies so the next request can retry.
    clearRefreshCookies(response);
  }

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
