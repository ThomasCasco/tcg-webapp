/**
 * GET /api/cron/refresh-mp-tokens
 *
 * Proactively refreshes seller MP tokens that will expire within 1 hour.
 * Should be called by a cron job every 30 minutes.
 *
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */

import { getSoonExpiringCredentials, saveMpCredentials } from "@/lib/server/mp-auth";
import { refreshMpToken } from "@/lib/server/mp-client";
import { log } from "@/lib/server/logger";

export async function GET(request: Request): Promise<Response> {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const REFRESH_WINDOW_SECONDS = 60 * 60; // refresh if expiring within 1 hour

  let credentials: Awaited<ReturnType<typeof getSoonExpiringCredentials>>;
  try {
    credentials = await getSoonExpiringCredentials(REFRESH_WINDOW_SECONDS);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("cron/refresh-mp-tokens: failed to list credentials", { message });
    return Response.json({ error: message }, { status: 500 });
  }

  if (credentials.length === 0) {
    log.info("cron/refresh-mp-tokens: no tokens to refresh");
    return Response.json({ refreshed: 0 });
  }

  const results = await Promise.allSettled(
    credentials.map(async (cred) => {
      if (!cred.refreshToken) {
        log.warn("cron/refresh-mp-tokens: no refresh_token", { sellerId: cred.sellerId });
        return { sellerId: cred.sellerId, status: "skipped" as const };
      }

      try {
        const refreshed = await refreshMpToken(cred.refreshToken);
        await saveMpCredentials({
          sellerId: cred.sellerId,
          mpUserId: refreshed.mpUserId,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresIn: refreshed.expiresIn,
          scope: refreshed.scope,
          liveMode: refreshed.liveMode,
        });
        log.info("cron/refresh-mp-tokens: refreshed", { sellerId: cred.sellerId });
        return { sellerId: cred.sellerId, status: "ok" as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error("cron/refresh-mp-tokens: refresh failed", { sellerId: cred.sellerId, message });
        return { sellerId: cred.sellerId, status: "error" as const, message };
      }
    }),
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : { status: "error", message: String(r.reason) },
  );

  const refreshedCount = summary.filter((s) => s.status === "ok").length;
  log.info("cron/refresh-mp-tokens: done", { total: credentials.length, refreshed: refreshedCount });

  return Response.json({ refreshed: refreshedCount, total: credentials.length, summary });
}
