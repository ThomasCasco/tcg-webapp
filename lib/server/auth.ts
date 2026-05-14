import { cookies } from "next/headers";
import type { Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase";
import { logger } from "@/lib/server/logger";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/shared/auth-cookies";

type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
};

type ProfileRow = {
  id: string;
  username: string;
};

function sanitizeUsername(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || `trainer_${Math.floor(Math.random() * 9000) + 1000}`;
}

function usernameCandidates(email: string, preferred?: string): string[] {
  const baseFromEmail = sanitizeUsername(email.split("@")[0] ?? "trainer");
  const candidates = [preferred, baseFromEmail]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map(sanitizeUsername);

  for (let index = 0; index < 4; index += 1) {
    candidates.push(`${baseFromEmail}_${Math.floor(Math.random() * 9000) + 1000}`);
  }

  return Array.from(new Set(candidates));
}

export async function setSessionCookies(response: NextResponse, session: Session) {
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

export async function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function ensureProfileForUser(
  userId: string,
  email: string,
  preferredUsername?: string,
): Promise<{ id: string; username: string }> {
  const admin = getSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id,username")
    .eq("id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing as ProfileRow;
  }

  const candidates = usernameCandidates(email, preferredUsername);

  for (const candidate of candidates) {
    const { data, error } = await admin
      .from("profiles")
      .insert({ id: userId, username: candidate })
      .select("id,username")
      .single();

    if (!error && data) {
      return data as ProfileRow;
    }

    if (error && !error.message.toLowerCase().includes("duplicate key")) {
      throw new Error(error.message);
    }
  }

  throw new Error("Could not provision user profile.");
}

type AccessTokenClaims = {
  sub: string;
  email: string;
  exp: number;
};

// Local JWT decode — no signature check, no network. The cookie is httpOnly +
// secure, set by our own login/refresh flow that already validated the token
// against Supabase. Trusting the cookie's contents is the same trust model
// supabase-js uses for getSession().
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
      "=",
    );
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as Partial<AccessTokenClaims>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) {
    return null;
  }

  const claims = decodeAccessToken(accessToken);
  if (!claims) {
    logger.warn("auth.getAuthenticatedUser.decode_failed");
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp <= nowSec) {
    // Cookie outlived the JWT — proxy refresh didn't catch it. Return null
    // (header shows logged-out) instead of redirecting; the next request will
    // give the proxy another chance to refresh.
    logger.warn("auth.getAuthenticatedUser.token_expired", {
      expSec: claims.exp,
      nowSec,
    });
    return null;
  }

  try {
    const profile = await ensureProfileForUser(claims.sub, claims.email);
    return {
      id: claims.sub,
      email: claims.email,
      username: profile.username,
    };
  } catch (error) {
    logger.error("auth.getAuthenticatedUser.profile_failed", {
      userId: claims.sub,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
