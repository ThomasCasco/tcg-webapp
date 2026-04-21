import { listings } from "@/lib/domain/mock-data";
import type { CardCondition, Listing } from "@/lib/domain/types";

const validConditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

type CreateListingPayload = {
  cardName?: string;
  setName?: string;
  condition?: CardCondition;
  priceArs?: number;
  quantity?: number;
};

function isValidCondition(value: unknown): value is CardCondition {
  return typeof value === "string" && validConditions.includes(value as CardCondition);
}

export async function GET() {
  return Response.json({
    items: listings,
    total: listings.length,
  });
}

export async function POST(request: Request) {
  let payload: CreateListingPayload;

  try {
    payload = (await request.json()) as CreateListingPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.cardName || payload.cardName.trim().length < 2) {
    return Response.json(
      { error: "cardName is required and must have at least 2 characters." },
      { status: 400 },
    );
  }

  if (!payload.setName || payload.setName.trim().length < 2) {
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

  const listing: Listing = {
    id: `lst_${Date.now()}`,
    sellerId: "seller_demo",
    inventoryId: "pending_inventory_ref",
    cardName: payload.cardName.trim(),
    setName: payload.setName.trim(),
    condition: payload.condition,
    priceArs: Math.round(payload.priceArs),
    quantity: payload.quantity ?? 1,
    status: "active",
  };

  return Response.json(
    {
      listing,
      warning: "Persistence is not connected yet. This is a stub response.",
    },
    { status: 201 },
  );
}