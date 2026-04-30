import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/shared/auth-cookies";

const protectedPaths = ["/inventory", "/listings", "/transactions", "/disputes", "/alerts"];
const authPaths = ["/login", "/register"];

export function proxy(request: NextRequest) {
  // Propagate / generate request-ID for structured logging
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const path = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  let response: NextResponse;

  if (protectedPaths.some((protectedPath) => path.startsWith(protectedPath)) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    response = NextResponse.redirect(loginUrl);
  } else if (authPaths.some((authPath) => path.startsWith(authPath)) && hasSession) {
    response = NextResponse.redirect(new URL("/inventory", request.url));
  } else {
    response = NextResponse.next();
  }

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
