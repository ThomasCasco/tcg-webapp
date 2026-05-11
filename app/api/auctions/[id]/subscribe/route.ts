import {
  subscribeToAuction,
  unsubscribeFromAuction,
  getAuctionById,
} from "@/lib/server/repository";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = getRequestIp(request);
  const limit = rateLimit(`auction-sub:${user.id}:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await context.params;
  const auction = await getAuctionById(id);
  if (!auction) {
    return Response.json({ error: "Subasta no encontrada." }, { status: 404 });
  }
  if (auction.status !== "scheduled" && auction.status !== "active") {
    return Response.json(
      { error: "Solo se puede seguir subastas programadas o activas." },
      { status: 400 },
    );
  }

  try {
    await subscribeToAuction({ auctionId: id, userId: user.id });
    return Response.json({ subscribed: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to subscribe." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = getRequestIp(request);
  const limit = rateLimit(`auction-unsub:${user.id}:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await context.params;
  try {
    await unsubscribeFromAuction({ auctionId: id, userId: user.id });
    return Response.json({ subscribed: false });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to unsubscribe." },
      { status: 500 },
    );
  }
}
