import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  listNotificationsForUser,
  markNotificationsRead,
} from "@/lib/server/repository";

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unreadOnly") === "1";
  const limit = Number(url.searchParams.get("limit") ?? 50);

  try {
    const items = await listNotificationsForUser(user.id, {
      unreadOnly,
      limit: Number.isFinite(limit) ? limit : 50,
    });
    return Response.json({
      items,
      total: items.length,
      unreadCount: items.filter((n) => !n.readAt).length,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list notifications.",
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

  let payload: { ids?: string[] } = {};
  try {
    payload = (await request.json()) as { ids?: string[] };
  } catch {
    payload = {};
  }

  try {
    const updated = await markNotificationsRead({
      userId: user.id,
      ids: Array.isArray(payload.ids) ? payload.ids : undefined,
    });
    return Response.json({ updated });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to mark notifications.",
      },
      { status: 500 },
    );
  }
}
