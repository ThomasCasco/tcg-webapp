import { inventoryEntries } from "@/lib/domain/mock-data";
import type { CardCondition, InventoryEntry } from "@/lib/domain/types";

const validConditions: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

type CreateInventoryPayload = {
  cardName?: string;
  condition?: CardCondition;
  quantity?: number;
  askingPriceArs?: number;
};

function isValidCondition(value: unknown): value is CardCondition {
  return typeof value === "string" && validConditions.includes(value as CardCondition);
}

export async function GET() {
  return Response.json({
    items: inventoryEntries,
    total: inventoryEntries.length,
  });
}

export async function POST(request: Request) {
  let payload: CreateInventoryPayload;

  try {
    payload = (await request.json()) as CreateInventoryPayload;
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      {
        status: 400,
      },
    );
  }

  if (!payload.cardName || payload.cardName.trim().length < 2) {
    return Response.json(
      { error: "cardName is required and must have at least 2 characters." },
      { status: 400 },
    );
  }

  if (!isValidCondition(payload.condition)) {
    return Response.json(
      { error: "condition is required and must be a valid value." },
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

  const item: InventoryEntry = {
    id: `inv_${Date.now()}`,
    ownerId: "seller_demo",
    cardId: "pending_catalog_match",
    cardName: payload.cardName.trim(),
    condition: payload.condition,
    quantity,
    askingPriceArs: payload.askingPriceArs,
    createdAt: new Date().toISOString(),
  };

  return Response.json(
    {
      item,
      warning: "Persistence is not connected yet. This is a stub response.",
    },
    { status: 201 },
  );
}