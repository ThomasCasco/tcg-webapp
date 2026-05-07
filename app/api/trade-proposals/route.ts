import type { TradeProposalStatus } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  createTradeProposal,
  listTradeProposalsForUser,
  updateTradeProposalStatus,
} from "@/lib/server/repository";

type CreateProposalPayload = {
  recipientId?: string;
  recipientHandle?: string;
  offeredInventoryIds?: string[];
  requestedInventoryIds?: string[];
  message?: string;
};

type UpdateProposalPayload = {
  id?: string;
  status?: TradeProposalStatus;
};

const validStatuses: TradeProposalStatus[] = [
  "accepted",
  "completed",
  "declined",
  "cancelled",
  "pending",
];

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await listTradeProposalsForUser(user.id);
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to list trade proposals." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let payload: CreateProposalPayload;
  try {
    payload = (await request.json()) as CreateProposalPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.recipientId || !payload.recipientHandle) {
    return Response.json({ error: "recipientId and recipientHandle are required." }, { status: 400 });
  }

  try {
    const proposal = await createTradeProposal({
      proposerId: user.id,
      proposerHandle: user.username,
      recipientId: payload.recipientId,
      recipientHandle: payload.recipientHandle,
      offeredInventoryIds: payload.offeredInventoryIds ?? [],
      requestedInventoryIds: payload.requestedInventoryIds ?? [],
      message: payload.message,
    });
    return Response.json({ proposal }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create trade proposal." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let payload: UpdateProposalPayload;
  try {
    payload = (await request.json()) as UpdateProposalPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id || !payload.status || !validStatuses.includes(payload.status)) {
    return Response.json({ error: "id and valid status are required." }, { status: 400 });
  }

  try {
    const proposal = await updateTradeProposalStatus({
      userId: user.id,
      proposalId: payload.id,
      nextStatus: payload.status,
    });
    return Response.json({ proposal });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update trade proposal." },
      { status: 500 },
    );
  }
}
