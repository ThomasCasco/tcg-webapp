import type { FulfillmentStatus } from "@/lib/domain/types";
import {
  canRateTransaction,
  type RatingEligibility,
  type RatingRecord,
} from "@/lib/domain/reputation";
import { getSupabaseAdminClient } from "@/lib/server/supabase";
import {
  getRatingByTransactionAndRater,
  mapRatingRow,
  type RatingRow,
} from "@/lib/server/reputation/queries";

type RatingTransactionRow = {
  transaction_id: string;
  buyer_id: string | null;
  listing_id: string | null;
  fulfillment_status: FulfillmentStatus;
};

type RatingListingRow = {
  id: string;
  seller_id: string | null;
};

export type SubmitSellerRatingResult =
  | { ok: true; rating: RatingRecord; created: boolean }
  | { ok: false; error: string; status: 403 | 404 | 409 | 422 };

export async function submitSellerRating(input: {
  transactionId: string;
  actorUserId: string;
  stars: number;
  comment?: string;
}): Promise<SubmitSellerRatingResult> {
  const transactionId = input.transactionId.trim();
  const existing = await getRatingByTransactionAndRater(transactionId, input.actorUserId);
  if (existing) return { ok: true, rating: existing, created: false };

  const client = getSupabaseAdminClient();
  const { data: paymentData, error: paymentError } = await client
    .from("payment_events")
    .select("transaction_id, buyer_id, listing_id, fulfillment_status")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (paymentError) throw new Error(paymentError.message);
  if (!paymentData) {
    return { ok: false, error: "Transaccion no encontrada.", status: 404 };
  }

  const payment = paymentData as RatingTransactionRow;
  if (!payment.listing_id) {
    return {
      ok: false,
      error: "Esta transaccion no tiene una publicacion asociada para calificar.",
      status: 422,
    };
  }

  const { data: listingData, error: listingError } = await client
    .from("market_listings")
    .select("id, seller_id")
    .eq("id", payment.listing_id)
    .maybeSingle();

  if (listingError) throw new Error(listingError.message);
  if (!listingData) {
    return { ok: false, error: "Publicacion no encontrada.", status: 404 };
  }

  const listing = listingData as RatingListingRow;
  const eligibility = canRateTransaction({
    actorUserId: input.actorUserId,
    buyerId: payment.buyer_id,
    sellerId: listing.seller_id,
    fulfillmentStatus: payment.fulfillment_status,
  });

  if (!eligibility.allowed) {
    return fromEligibility(eligibility);
  }

  const { data, error } = await client
    .from("reputation_events")
    .insert({
      seller_id: listing.seller_id,
      transaction_event_id: null,
      event_type: "rating_submitted",
      score_delta: input.stars,
      metadata: {
        rater_id: input.actorUserId,
        rated_user_id: listing.seller_id,
        rated_role: "seller",
        transaction_id: transactionId,
        stars: input.stars,
        comment: input.comment ?? null,
      },
    })
    .select("id, seller_id, score_delta, metadata, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const existingAfterConflict = await getRatingByTransactionAndRater(
        transactionId,
        input.actorUserId,
      );
      if (existingAfterConflict) {
        return { ok: true, rating: existingAfterConflict, created: false };
      }
    }
    throw new Error(error.message);
  }

  if (!data) throw new Error("Failed to create rating.");

  return { ok: true, rating: mapRatingRow(data as RatingRow), created: true };
}

function fromEligibility(
  eligibility: Exclude<RatingEligibility, { allowed: true }>,
): SubmitSellerRatingResult {
  return {
    ok: false,
    error: eligibility.reason,
    status: eligibility.status,
  };
}
