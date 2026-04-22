import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createDispute, listDisputesForUser } from "@/lib/server/repository";

type DisputePayload = {
  transactionId?: string;
  reason?: string;
  details?: string;
};

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listDisputesForUser(user.id);
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list disputes.",
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

  let payload: DisputePayload;
  try {
    payload = (await request.json()) as DisputePayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.transactionId || payload.transactionId.trim().length < 6) {
    return Response.json({ error: "transactionId is required." }, { status: 400 });
  }

  if (!payload.reason || payload.reason.trim().length < 4) {
    return Response.json({ error: "reason is required." }, { status: 400 });
  }

  if (!payload.details || payload.details.trim().length < 10) {
    return Response.json(
      { error: "details must have at least 10 characters." },
      { status: 400 },
    );
  }

  try {
    const dispute = await createDispute({
      transactionId: payload.transactionId.trim(),
      openedById: user.id,
      openedByHandle: user.username,
      reason: payload.reason.trim(),
      details: payload.details.trim(),
    });

    return Response.json({ dispute }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create dispute.",
      },
      { status: 500 },
    );
  }
}
