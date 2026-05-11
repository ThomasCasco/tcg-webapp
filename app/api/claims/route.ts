import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createClaimSession, listClaimSessions } from "@/lib/server/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  try {
    if (scope === "mine") {
      const user = await requireAuthenticatedUser();
      const sessions = await listClaimSessions({ sellerId: user.id });
      return NextResponse.json(sessions);
    }
    const sessions = await listClaimSessions({ status: ["active"] });
    return NextResponse.json(sessions);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json() as {
      title?: string;
      description?: string;
      cards?: Array<{
        inventoryEntryId?: string;
        cardName: string;
        setName?: string;
        imageUrl?: string;
        condition: string;
        priceArs: number;
      }>;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }
    if (!body.cards || body.cards.length === 0) {
      return NextResponse.json({ error: "Agregá al menos una carta." }, { status: 400 });
    }

    const session = await createClaimSession({
      sellerId: user.id,
      sellerHandle: user.username,
      title: body.title,
      description: body.description,
      cards: body.cards.map((c) => ({
        inventoryEntryId: c.inventoryEntryId,
        cardName: c.cardName,
        setName: c.setName,
        imageUrl: c.imageUrl,
        condition: c.condition as import("@/lib/domain/types").CardCondition,
        priceArs: Number(c.priceArs) || 0,
      })),
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    const status = err instanceof Error && err.message.includes("Sin permiso") ? 403 : 400;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status });
  }
}
