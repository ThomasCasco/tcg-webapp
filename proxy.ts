import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/shared/auth-cookies";

const protectedPaths = ["/inventory", "/listings", "/transactions", "/disputes", "/alerts"];
const authPaths = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  if (protectedPaths.some((protectedPath) => path.startsWith(protectedPath)) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.some((authPath) => path.startsWith(authPath)) && hasSession) {
    return NextResponse.redirect(new URL("/inventory", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inventory/:path*",
    "/listings/:path*",
    "/transactions/:path*",
    "/disputes/:path*",
    "/alerts/:path*",
    "/login",
    "/register",
  ],
};
