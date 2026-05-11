import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { advanceClaimCard } from "@/lib/server/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { skip?: boolean };
    const session = await advanceClaimCard({
      sessionId: id,
      sellerUserId: user.id,
      skipCurrent: body.skip ?? true,
    });
    return NextResponse.json(session);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("Sin permiso") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
