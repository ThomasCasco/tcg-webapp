import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createDispute, listDisputesForUser } from "@/lib/server/repository";
import { getTransactionContext } from "@/lib/server/transaction-context";
import { createNotification } from "@/lib/server/notifications";
import { sendDisputeOpened } from "@/lib/server/email";
import { log } from "@/lib/server/logger";

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
    const transactionId = payload.transactionId.trim();
    const reason = payload.reason.trim();
    const details = payload.details.trim();

    const dispute = await createDispute({
      transactionId,
      openedById: user.id,
      openedByHandle: user.username,
      reason,
      details,
    });

    void notifyDisputeOpened({
      transactionId,
      openedById: user.id,
      openedByHandle: user.username,
      reason,
      details,
    }).catch((err) =>
      log.error("notifyDisputeOpened failed", {
        transactionId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );

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

async function notifyDisputeOpened(opts: {
  transactionId: string;
  openedById: string;
  openedByHandle: string;
  reason: string;
  details: string;
}): Promise<void> {
  const ctx = await getTransactionContext(opts.transactionId);
  if (!ctx) return;

  const linkPath = `/transactions/${ctx.transactionId}`;
  const parties: Array<{
    id: string | null;
    email: string | null;
    username: string;
  }> = [ctx.buyer, ctx.seller];

  for (const party of parties) {
    if (!party.id || party.id === opts.openedById) continue;
    if (party.email) {
      await sendDisputeOpened({
        to: party.email,
        recipientName: party.username,
        openedBy: opts.openedByHandle,
        cardName: ctx.cardName,
        reason: opts.reason,
        details: opts.details,
        transactionId: ctx.transactionId,
      }).catch((err) => log.error("dispute email failed", { error: String(err) }));
    }
    await createNotification({
      userId: party.id,
      type: "dispute_opened",
      title: "Se abrió una disputa",
      body: `${opts.openedByHandle} abrió una disputa sobre ${ctx.cardName}: ${opts.reason}.`,
      linkPath,
    });
  }
}
