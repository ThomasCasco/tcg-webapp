import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/shared/app-url";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";
import { getSupabaseAnonClient } from "@/lib/server/supabase";
import { log } from "@/lib/server/logger";

type ForgotPasswordPayload = {
  email?: string;
};

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth-forgot-password:${ip}`, 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: ForgotPasswordPayload;
  try {
    payload = (await request.json()) as ForgotPasswordPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  try {
    const anon = getSupabaseAnonClient();
    const { error } = await anon.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/reset-password`,
    });
    if (error) {
      log.warn("forgot-password: reset email failed", { message: error.message });
    }
  } catch (error) {
    log.warn("forgot-password: reset email skipped", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Si existe una cuenta con ese email, te enviamos un link para cambiar la contraseña.",
  });
}
