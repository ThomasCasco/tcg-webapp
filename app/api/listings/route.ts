import {
  cancelListing,
  createListing,
  listListings,
  updateListing,
} from "@/lib/server/repository";
import type { CardCondition, Listing, ListingType } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
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

const validListingTypes: ListingType[] = ["single", "mystery_pack"];

type CreateListingPayload = {
  inventoryId?: string;
  cardName?: string;
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition?: CardCondition;
  priceArs?: number;
  quantity?: number;
  listingType?: ListingType;
  packCardCount?: number;
  packRarityFloor?: string;
  packTheme?: string;
  packDescription?: string;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string;
};

type PatchListingPayload = {
  id?: string;
  priceArs?: number;
  quantity?: number;
  imageUrl?: string | null;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string | null;
};

function isValidCondition(value: unknown): value is CardCondition {
  return typeof value === "string" && validConditions.includes(value as CardCondition);
}

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`listings-get:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");

  try {
    if (scope === "mine") {
      const user = await requireAuthenticatedUser().catch(() => null);
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const items = await listListings({ sellerId: user.id });

      return Response.json({
        items,
        total: items.length,
      });
    }

    const items = await listListings({ onlyPublic: true });
    return Response.json({
      items,
      total: items.length,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load listings.",
      },
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
  const limit = rateLimit(`listing-post:${user.id}:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let payload: CreateListingPayload;

  try {
    payload = (await request.json()) as CreateListingPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const listingType: ListingType =
    payload.listingType && validListingTypes.includes(payload.listingType)
      ? payload.listingType
      : "single";

  if (!payload.cardName || payload.cardName.trim().length < 2) {
    return Response.json(
      { error: "cardName is required and must have at least 2 characters." },
      { status: 400 },
    );
  }

  if (listingType === "single" && (!payload.setName || payload.setName.trim().length < 2)) {
    return Response.json(
      { error: "setName is required and must have at least 2 characters." },
      { status: 400 },
    );
  }

  if (!isValidCondition(payload.condition)) {
    return Response.json(
      { error: "condition is required and must be a valid value." },
      { status: 400 },
    );
  }

  if (!payload.priceArs || payload.priceArs <= 0) {
    return Response.json(
      { error: "priceArs is required and must be greater than 0." },
      { status: 400 },
    );
  }

  const quantity = payload.quantity ?? 1;
  if (quantity <= 0 || quantity > 100) {
    return Response.json(
      { error: "quantity must be between 1 and 100." },
      { status: 400 },
    );
  }

  if (listingType === "mystery_pack") {
    const count = payload.packCardCount ?? 0;
    if (count <= 0 || count > 50) {
      return Response.json(
        { error: "packCardCount must be between 1 and 50." },
        { status: 400 },
      );
    }
    if (!payload.packDescription || payload.packDescription.trim().length < 20) {
      return Response.json(
        { error: "packDescription must have at least 20 characters." },
        { status: 400 },
      );
    }
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
            : "Datos de entrega inválidos.",
      },
      { status: 400 },
    );
  }

  try {
    const listing: Listing = await createListing({
      sellerId: user.id,
      sellerHandle: user.username,
      inventoryId: payload.inventoryId,
      cardName: payload.cardName.trim(),
      setName: (payload.setName ?? "Mystery Pack").trim(),
      catalogCardId: payload.catalogCardId?.trim() || undefined,
      imageUrl: payload.imageUrl?.trim() || undefined,
      condition: payload.condition,
      priceArs: payload.priceArs,
      quantity,
      listingType,
      packCardCount: payload.packCardCount,
      packRarityFloor: payload.packRarityFloor?.trim(),
      packTheme: payload.packTheme?.trim(),
      packDescription: payload.packDescription?.trim(),
      offersShipping: Boolean(payload.offersShipping),
      offersPickup: Boolean(payload.offersPickup),
      deliveryAreaNotes: String(payload.deliveryAreaNotes ?? "").trim(),
    });

    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create listing.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PatchListingPayload;
  try {
    payload = (await request.json()) as PatchListingPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const wantsUpdate =
    typeof payload.priceArs === "number" ||
    typeof payload.quantity === "number" ||
    payload.imageUrl !== undefined ||
    typeof payload.offersShipping === "boolean" ||
    typeof payload.offersPickup === "boolean" ||
    payload.deliveryAreaNotes !== undefined;

  try {
    if (wantsUpdate) {
      const listing = await updateListing({
        listingId: payload.id,
        sellerId: user.id,
        priceArs: payload.priceArs,
        quantity: payload.quantity,
        imageUrl: payload.imageUrl,
        offersShipping: payload.offersShipping,
        offersPickup: payload.offersPickup,
        deliveryAreaNotes: payload.deliveryAreaNotes,
      });
      return Response.json({ listing });
    }

    const listing = await cancelListing({
      listingId: payload.id,
      sellerId: user.id,
    });

    return Response.json({ listing });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update or cancel listing.",
      },
      { status: 500 },
    );
  }
}