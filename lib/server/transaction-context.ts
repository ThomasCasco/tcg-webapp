/**
 * Look up the buyer, seller, listing and payment context for a transaction
 * in a single place. Used by routes that need to send emails / notifications
 * after a state change so we don't repeat 4 queries in every handler.
 */

import { getSupabaseAdminClient } from "@/lib/server/supabase";

export type TransactionContext = {
  transactionId: string;
  listingId: string;
  cardName: string;
  priceArs: number;
  platformFeeArs: number | null;
  offersShipping: boolean;
  offersPickup: boolean;
  shippingTracking: string | null;
  buyer: { id: string | null; handle: string; email: string | null; username: string };
  seller: { id: string | null; handle: string; email: string | null; username: string };
};

export async function getTransactionContext(
  transactionId: string,
): Promise<TransactionContext | null> {
  const client = getSupabaseAdminClient();

  const { data: payment, error: paymentError } = await client
    .from("payment_events")
    .select(
      "transaction_id, listing_id, buyer_id, buyer_handle, platform_fee_ars, shipping_tracking",
    )
    .eq("transaction_id", transactionId.trim())
    .maybeSingle();

  if (paymentError || !payment) return null;
  const p = payment as {
    transaction_id: string;
    listing_id: string;
    buyer_id: string | null;
    buyer_handle: string;
    platform_fee_ars: number | null;
    shipping_tracking: string | null;
  };

  const { data: listing, error: listingError } = await client
    .from("market_listings")
    .select(
      "id, card_name, price_ars, seller_id, seller_handle, offers_shipping, offers_pickup",
    )
    .eq("id", p.listing_id)
    .maybeSingle();

  if (listingError || !listing) return null;
  const l = listing as {
    id: string;
    card_name: string;
    price_ars: number;
    seller_id: string | null;
    seller_handle: string;
    offers_shipping: boolean;
    offers_pickup: boolean;
  };

  const [buyerProfile, sellerProfile] = await Promise.all([
    p.buyer_id ? loadProfile(p.buyer_id) : Promise.resolve(null),
    l.seller_id ? loadProfile(l.seller_id) : Promise.resolve(null),
  ]);

  return {
    transactionId: p.transaction_id,
    listingId: l.id,
    cardName: l.card_name,
    priceArs: Number(l.price_ars),
    platformFeeArs: p.platform_fee_ars == null ? null : Number(p.platform_fee_ars),
    offersShipping: l.offers_shipping,
    offersPickup: l.offers_pickup,
    shippingTracking: p.shipping_tracking,
    buyer: {
      id: p.buyer_id,
      handle: p.buyer_handle,
      email: buyerProfile?.email ?? null,
      username: buyerProfile?.username ?? p.buyer_handle,
    },
    seller: {
      id: l.seller_id,
      handle: l.seller_handle,
      email: sellerProfile?.email ?? null,
      username: sellerProfile?.username ?? l.seller_handle,
    },
  };
}

async function loadProfile(userId: string): Promise<{ email: string | null; username: string } | null> {
  const client = getSupabaseAdminClient();
  const [emailResult, profileResult] = await Promise.all([
    client.auth.admin.getUserById(userId),
    client.from("profiles").select("username").eq("id", userId).maybeSingle(),
  ]);
  if (emailResult.error || !emailResult.data.user) return null;
  return {
    email: emailResult.data.user.email ?? null,
    username: (profileResult.data as { username: string } | null)?.username ?? "usuario",
  };
}

/**
 * The transaction's delivery mode for the order page / state machine.
 * If the listing only offers one method we use it; if both, we default to
 * "shipping" since that's the path that requires the most tracking. UI can
 * still let the parties switch by coordinating in chat.
 */
export type DeliveryMode = "shipping" | "pickup";

export function inferDeliveryMode(ctx: Pick<TransactionContext, "offersShipping" | "offersPickup">): DeliveryMode {
  if (ctx.offersPickup && !ctx.offersShipping) return "pickup";
  return "shipping";
}
