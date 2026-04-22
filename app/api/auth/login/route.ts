import { NextResponse } from "next/server";
import { ensureProfileForUser, setSessionCookies } from "@/lib/server/auth";
import { getSupabaseAnonClient } from "@/lib/server/supabase";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth-login:${ip}`, 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y password son requeridos." },
      { status: 400 },
    );
  }

  const anon = getSupabaseAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Credenciales invalidas." },
      { status: 401 },
    );
  }

  const profile = await ensureProfileForUser(data.user.id, email);

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email,
      username: profile.username,
    },
  });

  await setSessionCookies(response, data.session);

  return response;
}
