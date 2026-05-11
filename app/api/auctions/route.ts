import { createAuction, listAuctions } from "@/lib/server/repository";
import type { AuctionStatus, CardCondition } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";

const validConditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

const validStatuses: AuctionStatus[] = [
  "scheduled",
  "active",
  "ended",
  "cancelled",
  "settled",
];

type CreateAuctionPayload = {
  inventoryId?: string;
  cardName?: string;
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition?: CardCondition;
  quantity?: number;
  startPriceArs?: number;
  bidIncrementArs?: number;
  buyoutPriceArs?: number;
  durationHours?: number;
  /** ISO date. Si viene, queda "scheduled" hasta esa fecha. */
  scheduledStartAt?: string;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string;
};

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auctions-get:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const statusParam = url.searchParams.getAll("status").filter((value) =>
    validStatuses.includes(value as AuctionStatus),
  ) as AuctionStatus[];

  try {
    const viewer = await getAuthenticatedUser().catch(() => null);
    if (scope === "mine") {
      if (!viewer) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const items = await listAuctions({
        sellerId: viewer.id,
        statuses: statusParam.length > 0 ? statusParam : undefined,
        viewerUserId: viewer.id,
      });
      return Response.json({ items, total: items.length });
    }

    const items = await listAuctions({
      onlyPublic: true,
      statuses: statusParam.length > 0 ? statusParam : undefined,
      viewerUserId: viewer?.id,
    });
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load auctions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`auction-post:${user.id}:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: CreateAuctionPayload;
  try {
    payload = (await request.json()) as CreateAuctionPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.inventoryId) {
    return Response.json({ error: "inventoryId is required." }, { status: 400 });
  }
  if (!payload.cardName || payload.cardName.trim().length < 2) {
    return Response.json({ error: "cardName invalido." }, { status: 400 });
  }
  if (!payload.condition || !validConditions.includes(payload.condition)) {
    return Response.json({ error: "condition invalido." }, { status: 400 });
  }
  const startPrice = Number(payload.startPriceArs);
  if (!Number.isFinite(startPrice) || startPrice <= 0) {
    return Response.json({ error: "startPriceArs invalido." }, { status: 400 });
  }
  const increment = Number(payload.bidIncrementArs);
  if (!Number.isFinite(increment) || increment <= 0) {
    return Response.json({ error: "bidIncrementArs invalido." }, { status: 400 });
  }
  const duration = Number(payload.durationHours);
  if (!Number.isFinite(duration) || duration < 1 || duration > 168) {
    return Response.json(
      { error: "durationHours debe estar entre 1 y 168." },
      { status: 400 },
    );
  }
  const quantity = Number(payload.quantity ?? 1);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100) {
    return Response.json({ error: "quantity invalido." }, { status: 400 });
  }

  try {
    assertListingLogisticsValid(
      Boolean(payload.offersShipping),
      Boolean(payload.offersPickup),
      String(payload.deliveryAreaNotes ?? ""),
    );
  } catch (validationError) {
    return Response.json(
      {
        error:
          validationError instanceof Error
            ? validationError.message
            : "Datos de entrega invalidos.",
      },
      { status: 400 },
    );
  }

  try {
    const auction = await createAuction({
      sellerId: user.id,
      sellerHandle: user.username,
      inventoryId: payload.inventoryId,
      cardName: payload.cardName.trim(),
      setName: payload.setName?.trim() || undefined,
      catalogCardId: payload.catalogCardId?.trim() || undefined,
      imageUrl: payload.imageUrl?.trim() || undefined,
      condition: payload.condition,
      quantity,
      startPriceArs: startPrice,
      bidIncrementArs: increment,
      buyoutPriceArs:
        payload.buyoutPriceArs && payload.buyoutPriceArs > 0
          ? Number(payload.buyoutPriceArs)
          : undefined,
      durationHours: duration,
      scheduledStartAt: payload.scheduledStartAt?.trim() || undefined,
      offersShipping: Boolean(payload.offersShipping),
      offersPickup: Boolean(payload.offersPickup),
      deliveryAreaNotes: String(payload.deliveryAreaNotes ?? "").trim(),
    });
    return Response.json({ auction }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create auction." },
      { status: 500 },
    );
  }
}
