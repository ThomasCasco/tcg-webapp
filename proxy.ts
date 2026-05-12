import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient, type Session } from "@supabase/supabase-js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/shared/auth-cookies";

const protectedPaths = ["/inventory", "/listings", "/transactions", "/disputes", "/alerts"];
const authPaths = ["/login", "/register"];

type RefreshOutcome =
  | { kind: "refreshed"; session: Session }
  | { kind: "failed" }
  | { kind: "skipped" };

async function tryRefreshSession(request: NextRequest): Promise<RefreshOutcome> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken || !refreshToken) {
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
      return { kind: "failed" };
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
  } else if (refresh.kind === "failed") {
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
