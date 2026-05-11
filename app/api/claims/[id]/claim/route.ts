import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { claimCard } from "@/lib/server/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const body = await request.json() as { cardId: string };

    if (!body.cardId) {
      return NextResponse.json({ error: "cardId es obligatorio." }, { status: 400 });
    }

    const card = await claimCard({
      sessionId: id,
      cardId: body.cardId,
      userId: user.id,
      userHandle: user.username,
    });

    return NextResponse.json(card);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("Sin permiso") || msg.includes("propias") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
