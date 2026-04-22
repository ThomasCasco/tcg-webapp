import { NextResponse } from "next/server";
import { ensureProfileForUser, setSessionCookies } from "@/lib/server/auth";
import { getSupabaseAnonClient } from "@/lib/server/supabase";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

type RegisterPayload = {
  email?: string;
  password?: string;
  username?: string;
};

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth-register:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: RegisterPayload;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const username = payload.username?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalido." }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "Username debe tener al menos 3 caracteres." },
      { status: 400 },
    );
  }

  const anon = getSupabaseAnonClient();
  const { data, error } = await anon.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo crear la cuenta." },
      { status: 400 },
    );
  }

  const profile = await ensureProfileForUser(data.user.id, email, username);

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email,
      username: profile.username,
    },
    requiresEmailConfirmation: !data.session,
  });

  if (data.session) {
    await setSessionCookies(response, data.session);
  }

  return response;
}
