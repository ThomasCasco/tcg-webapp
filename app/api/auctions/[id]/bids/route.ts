import { requireAuthenticatedUser } from "@/lib/server/auth";
import { listAuctionBids, placeAuctionBid } from "@/lib/server/repository";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const items = await listAuctionBids(id);
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load bids." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(request);
  const limit = rateLimit(`auction-bid:${user.id}:${ip}`, 40, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: { amountArs?: number };
  try {
    payload = (await request.json()) as { amountArs?: number };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const amountArs = Number(payload.amountArs ?? 0);
  if (!Number.isFinite(amountArs) || amountArs <= 0) {
    return Response.json({ error: "amountArs must be greater than 0." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const result = await placeAuctionBid({
      auctionId: id,
      bidderId: user.id,
      bidderHandle: user.username,
      amountArs,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to place bid." },
      { status: 500 },
    );
  }
}
