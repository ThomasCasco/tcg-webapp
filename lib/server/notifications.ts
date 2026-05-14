/**
 * Server-only helper to drop in-app notifications. The `notifications` table is
 * polled by the bell widget in the top bar (see app/api/notifications/route.ts).
 * All writes are fire-and-forget: a failure here must NOT block the
 * user-visible flow that triggered it.
 *
 * For reads, see repository.listNotificationsForUser / markNotificationsRead.
 */

import { getSupabaseAdminClient } from "@/lib/server/supabase";
import { log } from "@/lib/server/logger";

export type NotificationType =
  | "payment_verified_buyer"
  | "payment_verified_seller"
  | "shipped_to_buyer"
  | "delivered_to_seller"
  | "rate_seller_prompt"
  | "rating_received_seller"
  | "dispute_opened"
  | "dispute_resolved";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath?: string;
};

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link_path: input.linkPath ?? null,
    });
    if (error) {
      log.warn("createNotification: insert failed", {
        type: input.type,
        userId: input.userId,
        error: error.message,
      });
    }
  } catch (err) {
    log.warn("createNotification: threw", {
      type: input.type,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
