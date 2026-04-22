import { requireAuthenticatedUser } from "@/lib/server/auth";
import { listTransactionsForUser } from "@/lib/server/repository";

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listTransactionsForUser(user.id);
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list transactions.",
      },
      { status: 500 },
    );
  }
}
