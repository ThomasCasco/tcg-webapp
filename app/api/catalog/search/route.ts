import { searchCatalog } from "@/lib/server/tcgdex";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`catalog-search:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many searches. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const setQuery = url.searchParams.get("set") ?? "";
  const rawLimit = Number(url.searchParams.get("limit") ?? 24);
  const take = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 48) : 24;

  if (q.trim().length < 2) {
    return Response.json({ items: [], total: 0 });
  }

  try {
    const items = await searchCatalog(q, take, { setQuery });
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Catalog search failed." },
      { status: 502 },
    );
  }
}
