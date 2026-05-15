import { activateScheduledAuctions, closeAuction, listAuctions } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { log } from "@/lib/server/logger";

/**
 * Pasar subastas en `scheduled` a `active` cuando ya llegó su starts_at.
 * También cierra subastas activas vencidas.
 * Header: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Definí CRON_SECRET en el entorno del servidor." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase no configurado." }, { status: 503 });
  }

  try {
    const activated = await activateScheduledAuctions();

    // Cierre automatico de subastas vencidas.
    const now = Date.now();
    const active = await listAuctions({ statuses: ["active"] });
    let closed = 0;
    const closeFailures: Array<{ auctionId: string; error: string }> = [];
    for (const auction of active) {
      if (new Date(auction.endsAt).getTime() <= now && auction.sellerId) {
        try {
          await closeAuction({ auctionId: auction.id, actorUserId: auction.sellerId });
          closed += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log.error("cron.activate-scheduled-auctions.close_failed", {
            auctionId: auction.id,
            sellerId: auction.sellerId,
            endsAt: auction.endsAt,
            error: message,
          });
          closeFailures.push({ auctionId: auction.id, error: message });
        }
      }
    }

    return Response.json({ ok: true, activated, closed, closeFailures });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error al activar subastas." },
      { status: 500 },
    );
  }
}
