import { cookies } from "next/headers";
import type { JWK, Session, SupabaseClient } from "@supabase/supabase-js";
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

// The cookie is httpOnly, which stops scripts from reading it but not the user
// from writing it, so its contents must never be trusted without checking the
// signature. getClaims() verifies asymmetric (ES256) tokens locally against the
// project's cached JWKS, and falls back to asking the Auth server for anything
// else (HS*, alg "none", unknown kid), so forged tokens fail closed.
export async function verifyAccessToken(
  token: string,
  options?: { client?: SupabaseClient; jwks?: { keys: JWK[] } },
): Promise<AccessTokenClaims | null> {
  if (!token || token.split(".").length !== 3) return null;

  try {
    const client = options?.client ?? getSupabaseAdminClient();
    const { data, error } = await client.auth.getClaims(
      token,
      options?.jwks ? { jwks: options.jwks } : undefined,
    );
    if (error || !data) return null;

    const { sub, email, exp } = data.claims;
    if (typeof sub !== "string" || typeof exp !== "number") return null;
    return { sub, email: typeof email === "string" ? email : "", exp };
  } catch {
    // getClaims throws on expired or malformed tokens.
    return null;
  }
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) {
    return null;
  }

  const claims = await verifyAccessToken(accessToken);
  if (!claims) {
    // Invalid signature, expired (the proxy refresh didn't catch it) or
    // malformed. Return null so the UI shows logged-out; the next request gives
    // the proxy another chance to refresh.
    logger.warn("auth.getAuthenticatedUser.verify_failed");
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
