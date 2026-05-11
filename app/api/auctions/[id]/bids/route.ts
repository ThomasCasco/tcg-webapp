import { listAuctionBids, placeAuctionBid } from "@/lib/server/repository";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const bids = await listAuctionBids(id);
    return Response.json({ items: bids, total: bids.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load bids." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`auction-bid:${user.id}:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Demasiadas pujas. Probá en ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: { amountArs?: number };
  try {
    payload = (await request.json()) as { amountArs?: number };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const amount = Number(payload.amountArs);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "amountArs invalido." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const result = await placeAuctionBid({
      auctionId: id,
      bidderId: user.id,
      bidderHandle: user.username,
      amountArs: amount,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to place bid." },
      { status: 400 },
    );
  }
}
