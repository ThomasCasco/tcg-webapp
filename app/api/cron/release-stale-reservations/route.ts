import { releaseStalePendingListings } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

/**
 * Liberar publicaciones en `pending_payment` sin pago verificado después de N horas.
 * Llamar desde Vercel Cron / GitHub Actions con header Authorization: Bearer CRON_SECRET
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
    const released = await releaseStalePendingListings(0.5);
    return Response.json({ ok: true, released });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error al liberar reservas." },
      { status: 500 },
    );
  }
}
