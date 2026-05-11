import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { completeOnboarding } from "@/lib/server/repository";

export async function POST() {
  try {
    const user = await requireAuthenticatedUser();
    await completeOnboarding(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 400 });
  }
}
