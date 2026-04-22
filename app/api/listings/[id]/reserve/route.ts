import { reserveListing } from "@/lib/server/repository";
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
  const limit = rateLimit(`listing-reserve:${user.id}:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const { id } = await context.params;

  try {
    const result = await reserveListing({
      listingId: id,
      buyerId: user.id,
      buyerHandle: user.username,
    });

    return Response.json({
      listing: result.listing,
      transactionId: result.transactionId,
      message: "Listing reserved. Complete payment verification to mark as sold.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reserve listing.";
    const status = message === "Listing is not available." ? 409 : 500;

    return Response.json({ error: message }, { status });
  }
}
