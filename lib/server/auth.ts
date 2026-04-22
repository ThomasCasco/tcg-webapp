import { cookies } from "next/headers";
import type { Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseAnonClient } from "@/lib/server/supabase";
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

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) {
    return null;
  }

  const anon = getSupabaseAnonClient();
  const { data, error } = await anon.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  const email = data.user.email ?? "";
  const profile = await ensureProfileForUser(data.user.id, email);

  return {
    id: data.user.id,
    email,
    username: profile.username,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
