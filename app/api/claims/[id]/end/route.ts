import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { endClaimSession } from "@/lib/server/repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const session = await endClaimSession({ sessionId: id, sellerUserId: user.id });
    return NextResponse.json(session);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("Sin permiso") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
