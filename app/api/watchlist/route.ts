import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  createWatch,
  deleteWatch,
  listWatchesForUser,
} from "@/lib/server/repository";

type CreateWatchPayload = {
  query?: string;
  maxPriceArs?: number;
};

type DeleteWatchPayload = {
  id?: string;
};

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listWatchesForUser(user.id);
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to list watches." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateWatchPayload;
  try {
    payload = (await request.json()) as CreateWatchPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.query || payload.query.trim().length < 2) {
    return Response.json(
      { error: "query must have at least 2 characters." },
      { status: 400 },
    );
  }

  try {
    const watch = await createWatch({
      userId: user.id,
      query: payload.query,
      maxPriceArs:
        typeof payload.maxPriceArs === "number" && payload.maxPriceArs > 0
          ? Math.round(payload.maxPriceArs)
          : undefined,
    });
    return Response.json({ watch }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create watch." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: DeleteWatchPayload;
  try {
    payload = (await request.json()) as DeleteWatchPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  try {
    await deleteWatch({ userId: user.id, watchId: payload.id });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete watch." },
      { status: 500 },
    );
  }
}
