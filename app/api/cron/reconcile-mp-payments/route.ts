import { listPendingMpReconciliations } from "@/lib/server/repository";
import { reconcileMpTransaction } from "@/lib/server/mp-reconcile";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { log } from "@/lib/server/logger";

/**
 * GET /api/cron/reconcile-mp-payments
 *
 * Catches transactions that the webhook never closed. For each MP
 * `payment_event` still in `pending_review` with a checkout in flight, query
 * MP by `external_reference` and verify if approved. Idempotent.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Wire it up to Vercel
 * Cron / GitHub Actions on whatever cadence (every 5–15 min is plenty).
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

  let pending: Awaited<ReturnType<typeof listPendingMpReconciliations>>;
  try {
    pending = await listPendingMpReconciliations(48);
  } catch (err) {
    log.error("reconcile-mp-payments: listPendingMpReconciliations failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Failed to list pending transactions." }, { status: 500 });
  }

  const summary = { scanned: pending.length, verified: 0, stillPending: 0, blocked: 0, failed: 0 };

  for (const row of pending) {
    try {
      const outcome = await reconcileMpTransaction({ transactionId: row.transactionId });
      if (outcome.kind === "verified") summary.verified += 1;
      else if (outcome.kind === "still_pending") summary.stillPending += 1;
      else if (outcome.kind === "blocked") summary.blocked += 1;
      else summary.failed += 1;
    } catch (err) {
      summary.failed += 1;
      log.error("reconcile-mp-payments: reconcile threw", {
        transactionId: row.transactionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("reconcile-mp-payments: done", summary);
  return Response.json({ ok: true, ...summary });
}
