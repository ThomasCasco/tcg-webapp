/**
 * GET /api/cron/daily
 *
 * Single daily cron for Vercel Hobby accounts (1 cron/day limit).
 * Runs all maintenance tasks in sequence:
 *   1. Activate scheduled auctions + close expired ones
 *   2. Release stale pending listings
 *   3. Reconcile pending MP payments
 *   4. Refresh expiring MP tokens
 *
 * Auth: Authorization: Bearer CRON_SECRET
 */

import { NextResponse } from "next/server";
import {
  activateScheduledAuctions,
  closeAuction,
  listAuctions,
  listPendingMpReconciliations,
  releaseStalePendingListings,
} from "@/lib/server/repository";
import { reconcileMpTransaction } from "@/lib/server/mp-reconcile";
import { getSoonExpiringCredentials, saveMpCredentials } from "@/lib/server/mp-auth";
import { refreshMpToken } from "@/lib/server/mp-client";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { log } from "@/lib/server/logger";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  }

  const results: Record<string, unknown> = {};

  // ── 1. Activate scheduled auctions + close expired ─────────────────────
  try {
    const activated = await activateScheduledAuctions();
    const now = Date.now();
    const active = await listAuctions({ statuses: ["active"] });
    let closed = 0;
    for (const auction of active) {
      if (new Date(auction.endsAt).getTime() <= now && auction.sellerId) {
        try {
          await closeAuction({ auctionId: auction.id, actorUserId: auction.sellerId });
          closed++;
        } catch {
          // continue
        }
      }
    }
    results.auctions = { activated, closed };
  } catch (err) {
    results.auctions = { error: err instanceof Error ? err.message : String(err) };
    log.error("daily-cron: auctions failed", { error: results.auctions });
  }

  // ── 2. Release stale pending listings ───────────────────────────────────
  try {
    // 30 min: MP checkout sessions die quickly; longer holds just lock listings.
    const released = await releaseStalePendingListings(0.5);
    results.staleListings = { released };
  } catch (err) {
    results.staleListings = { error: err instanceof Error ? err.message : String(err) };
    log.error("daily-cron: stale listings failed", { error: results.staleListings });
  }

  // ── 3. Reconcile pending MP payments ────────────────────────────────────
  try {
    const pending = await listPendingMpReconciliations(48);
    const mp = { scanned: pending.length, verified: 0, stillPending: 0, failed: 0 };
    for (const row of pending) {
      try {
        const outcome = await reconcileMpTransaction({ transactionId: row.transactionId });
        if (outcome.kind === "verified") mp.verified++;
        else if (outcome.kind === "still_pending") mp.stillPending++;
        else mp.failed++;
      } catch {
        mp.failed++;
      }
    }
    results.mpReconcile = mp;
  } catch (err) {
    results.mpReconcile = { error: err instanceof Error ? err.message : String(err) };
    log.error("daily-cron: mp reconcile failed", { error: results.mpReconcile });
  }

  // ── 4. Refresh expiring MP tokens ───────────────────────────────────────
  try {
    const credentials = await getSoonExpiringCredentials(3600);
    let refreshed = 0;
    for (const cred of credentials) {
      if (!cred.refreshToken) continue;
      try {
        const updated = await refreshMpToken(cred.refreshToken);
        await saveMpCredentials({
          sellerId: cred.sellerId,
          mpUserId: updated.mpUserId,
          accessToken: updated.accessToken,
          refreshToken: updated.refreshToken,
          expiresIn: updated.expiresIn,
          scope: updated.scope,
          liveMode: updated.liveMode,
        });
        refreshed++;
      } catch {
        // continue
      }
    }
    results.mpTokens = { scanned: credentials.length, refreshed };
  } catch (err) {
    results.mpTokens = { error: err instanceof Error ? err.message : String(err) };
    log.error("daily-cron: mp tokens failed", { error: results.mpTokens });
  }

  log.info("daily-cron: done", results);
  return NextResponse.json({ ok: true, ...results });
}
