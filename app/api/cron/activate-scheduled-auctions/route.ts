import { activateScheduledAuctions, closeAuction, listAuctions } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

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
    for (const auction of active) {
      if (new Date(auction.endsAt).getTime() <= now && auction.sellerId) {
        try {
          await closeAuction({ auctionId: auction.id, actorUserId: auction.sellerId });
          closed += 1;
        } catch {
          // continuar con el resto
        }
      }
    }

    return Response.json({ ok: true, activated, closed });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error al activar subastas." },
      { status: 500 },
    );
  }
}
