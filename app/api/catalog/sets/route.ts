import { listSets } from "@/lib/server/tcgdex";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`catalog-sets:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  try {
    const items = await listSets();
    return Response.json(
      { items, total: items.length },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load sets." },
      { status: 502 },
    );
  }
}
