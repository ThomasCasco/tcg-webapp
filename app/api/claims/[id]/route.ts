import { NextResponse } from "next/server";
import { getClaimSession } from "@/lib/server/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getClaimSession(id);
    if (!session) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
