import type { FulfillmentStatus } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { updateFulfillmentStatus } from "@/lib/server/repository";

type FulfillmentPayload = {
  status?: FulfillmentStatus;
  trackingNumber?: string;
};

const allowedStatuses: FulfillmentStatus[] = [
  "seller_confirmed",
  "shipped",
  "delivered",
  "disputed",
  "closed",
];

function isStatus(value: unknown): value is FulfillmentStatus {
  return typeof value === "string" && allowedStatuses.includes(value as FulfillmentStatus);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: FulfillmentPayload;
  try {
    payload = (await request.json()) as FulfillmentPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isStatus(payload.status)) {
    return Response.json(
      { error: "status is required and must be a valid value." },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const payment = await updateFulfillmentStatus({
      transactionId: id,
      actorUserId: user.id,
      nextStatus: payload.status,
      trackingNumber: payload.trackingNumber,
    });

    return Response.json({ payment });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update fulfillment status.",
      },
      { status: 500 },
    );
  }
}
