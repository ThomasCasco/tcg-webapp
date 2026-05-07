import type { CardCondition } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  closeAuction,
  createAuction,
  listAuctions,
  listInventoryEntries,
} from "@/lib/server/repository";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";

type CreateAuctionPayload = {
  inventoryId?: string;
  startPriceArs?: number;
  bidIncrementArs?: number;
  buyoutPriceArs?: number;
  durationHours?: number;
  quantity?: number;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string;
};

type PatchAuctionPayload = {
  id?: string;
  action?: "close";
};

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auctions-get:${ip}`, 80, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const user = scope === "mine" || scope === "bids"
    ? await requireAuthenticatedUser().catch(() => null)
    : null;

  if ((scope === "mine" || scope === "bids") && !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listAuctions(
      scope === "mine"
        ? { sellerId: user!.id }
        : scope === "bids"
          ? { bidderId: user!.id }
          : { onlyPublic: true },
    );

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
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(request);
  const limit = rateLimit(`auction-post:${user.id}:${ip}`, 20, 60_000);
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

  try {
    assertListingLogisticsValid(
      Boolean(payload.offersShipping),
      Boolean(payload.offersPickup),
      String(payload.deliveryAreaNotes ?? ""),
    );
  } catch (validationError) {
    return Response.json(
      { error: validationError instanceof Error ? validationError.message : "Datos de entrega invalidos." },
      { status: 400 },
    );
  }

  try {
    const inventory = await listInventoryEntries({ ownerId: user.id });
    const entry = inventory.find((item) => item.id === payload.inventoryId);
    if (!entry) {
      return Response.json({ error: "La carta no existe en tu inventario." }, { status: 404 });
    }

    const auction = await createAuction({
      sellerId: user.id,
      sellerHandle: user.username,
      inventoryId: entry.id,
      cardName: entry.cardName,
      setName: entry.setName,
      catalogCardId: entry.catalogCardId,
      imageUrl: entry.imageUrl,
      condition: entry.condition as CardCondition,
      quantity: payload.quantity ?? 1,
      startPriceArs: payload.startPriceArs ?? 0,
      bidIncrementArs: payload.bidIncrementArs ?? 500,
      buyoutPriceArs: payload.buyoutPriceArs,
      durationHours: payload.durationHours ?? 24,
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

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let payload: PatchAuctionPayload;
  try {
    payload = (await request.json()) as PatchAuctionPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id || payload.action !== "close") {
    return Response.json({ error: "id and action=close are required." }, { status: 400 });
  }

  try {
    const auction = await closeAuction({ auctionId: payload.id, actorUserId: user.id });
    return Response.json({ auction });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to close auction." },
      { status: 500 },
    );
  }
}
