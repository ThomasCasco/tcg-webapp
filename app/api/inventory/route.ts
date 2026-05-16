import {
  createInventoryEntry,
  deleteInventoryEntry,
  listInventoryEntries,
  updateInventoryEntry,
} from "@/lib/server/repository";
import type { CardCondition, InventoryEntry } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

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
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  backImageUrl?: string;
  condition?: CardCondition;
  quantity?: number;
  askingPriceArs?: number;
  availableForTrade?: boolean;
  tradeNotes?: string;
};

type UpdateInventoryPayload = {
  id?: string;
  quantity?: number;
  askingPriceArs?: number;
  imageUrl?: string | null;
  backImageUrl?: string | null;
  availableForTrade?: boolean;
  tradeNotes?: string | null;
};

type DeleteInventoryPayload = {
  id?: string;
};

function isValidCondition(value: unknown): value is CardCondition {
  return typeof value === "string" && validConditions.includes(value as CardCondition);
}

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listInventoryEntries({ ownerId: user.id });
    return Response.json({
      items,
      total: items.length,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load inventory.",
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
  const limit = rateLimit(`inventory-post:${user.id}:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

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

  try {
    const item: InventoryEntry = await createInventoryEntry({
      ownerId: user.id,
      sellerHandle: user.username,
      cardName: payload.cardName.trim(),
      setName: payload.setName?.trim(),
      catalogCardId: payload.catalogCardId?.trim() || undefined,
      imageUrl: payload.imageUrl?.trim() || undefined,
      backImageUrl: payload.backImageUrl?.trim() || undefined,
      condition: payload.condition,
      quantity,
      askingPriceArs: payload.askingPriceArs,
      availableForTrade: Boolean(payload.availableForTrade),
      tradeNotes: payload.tradeNotes?.trim() || undefined,
    });

    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create inventory entry.",
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

  let payload: UpdateInventoryPayload;
  try {
    payload = (await request.json()) as UpdateInventoryPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  try {
    const item = await updateInventoryEntry({
      entryId: payload.id,
      ownerId: user.id,
      quantity: payload.quantity,
      askingPriceArs: payload.askingPriceArs,
      imageUrl: payload.imageUrl,
      backImageUrl: payload.backImageUrl,
      availableForTrade: payload.availableForTrade,
      tradeNotes: payload.tradeNotes,
    });

    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update inventory." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: DeleteInventoryPayload;
  try {
    payload = (await request.json()) as DeleteInventoryPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  try {
    await deleteInventoryEntry({
      entryId: payload.id,
      ownerId: user.id,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete inventory." },
      { status: 500 },
    );
  }
}
