import {
  listTransactionChatMessages,
  postTransactionChatMessage,
} from "@/lib/server/repository";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const transactionId = id.trim();
  if (transactionId.length < 4) {
    return Response.json({ error: "Invalid transaction id." }, { status: 400 });
  }

  try {
    const items = await listTransactionChatMessages({
      transactionId,
      actorUserId: user.id,
    });
    return Response.json({ items, total: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages.";
    let status = 500;
    if (message.includes("Not allowed")) status = 403;
    else if (message.includes("not found") || message.includes("Not found")) status = 404;
    return Response.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`tx-chat:${user.id}:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Demasiados mensajes. Reintentá en ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const transactionId = id.trim();
  if (transactionId.length < 4) {
    return Response.json({ error: "Invalid transaction id." }, { status: 400 });
  }

  let bodyText: string;
  try {
    const json = (await request.json()) as { body?: string };
    bodyText = String(json.body ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!bodyText) {
    return Response.json({ error: "body is required." }, { status: 400 });
  }

  try {
    const message = await postTransactionChatMessage({
      transactionId,
      actorUserId: user.id,
      actorHandle: user.username,
      body: bodyText,
    });
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message.";
    let status = 500;
    if (message.includes("Not allowed")) status = 403;
    else if (message.includes("between") || message.includes("Message body"))
      status = 400;
    else if (message.includes("not found") || message.includes("Not found")) status = 404;
    return Response.json({ error: message }, { status });
  }
}
