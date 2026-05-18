import {
  buildSellerReputationSummary,
  type RatingRecord,
  type SellerReputationSummary,
} from "@/lib/domain/reputation";
import { getSupabaseAdminClient } from "@/lib/server/supabase";

const RATING_EVENT_TYPES = ["rating", "rating_submitted"];

export type RatingRow = {
  id: string;
  seller_id: string;
  score_delta: number;
  metadata: {
    rater_id?: string;
    transaction_id?: string;
    stars?: number;
    comment?: string | null;
  };
  created_at: string;
};

type PaymentSummaryRow = {
  seller_id: string | null;
  fulfillment_status: string;
  verification_status: string;
};

type ProfileSummaryRow = {
  id: string;
  created_at: string | null;
};

export async function getRatingByTransactionAndRater(
  transactionId: string,
  raterId: string,
): Promise<RatingRecord | null> {
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("reputation_events")
    .select("id, seller_id, score_delta, metadata, created_at")
    .in("event_type", RATING_EVENT_TYPES)
    .eq("metadata->>transaction_id", transactionId.trim())
    .eq("metadata->>rater_id", raterId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRatingRow(data as RatingRow) : null;
}

export async function getSellerReputationSummary(
  sellerId: string,
): Promise<SellerReputationSummary> {
  const summaries = await getSellerReputationSummaries([sellerId]);
  return summaries[sellerId] ?? emptySummary(sellerId);
}

export async function getSellerReputationSummaries(
  sellerIds: string[],
): Promise<Record<string, SellerReputationSummary>> {
  const uniqueSellerIds = [...new Set(sellerIds.filter(Boolean))];
  if (uniqueSellerIds.length === 0) return {};

  const client = getSupabaseAdminClient();
  const [ratingsResult, paymentsResult, profilesResult, mpResult] = await Promise.all([
    client
      .from("reputation_events")
      .select("seller_id, score_delta")
      .in("seller_id", uniqueSellerIds)
      .in("event_type", RATING_EVENT_TYPES),
    client
      .from("payment_events")
      .select("seller_id, fulfillment_status, verification_status")
      .in("seller_id", uniqueSellerIds),
    client
      .from("profiles")
      .select("id, created_at")
      .in("id", uniqueSellerIds),
    client
      .from("seller_mp_credentials")
      .select("seller_id")
      .in("seller_id", uniqueSellerIds),
  ]);

  if (ratingsResult.error) throw new Error(ratingsResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);

  const ratingsBySeller = new Map<string, number[]>();
  for (const raw of ratingsResult.data ?? []) {
    const row = raw as { seller_id: string; score_delta: number };
    const score = Number(row.score_delta);
    if (!Number.isFinite(score)) continue;
    const current = ratingsBySeller.get(row.seller_id) ?? [];
    current.push(score);
    ratingsBySeller.set(row.seller_id, current);
  }

  const completedBySeller = new Map<string, number>();
  const disputesBySeller = new Map<string, number>();
  for (const raw of paymentsResult.data ?? []) {
    const row = raw as PaymentSummaryRow;
    if (!row.seller_id) continue;
    if (row.verification_status !== "verified") continue;
    if (row.fulfillment_status === "delivered" || row.fulfillment_status === "closed") {
      completedBySeller.set(row.seller_id, (completedBySeller.get(row.seller_id) ?? 0) + 1);
    }
    if (row.fulfillment_status === "disputed") {
      disputesBySeller.set(row.seller_id, (disputesBySeller.get(row.seller_id) ?? 0) + 1);
    }
  }

  const memberSinceBySeller = new Map<string, string>();
  for (const raw of profilesResult.data ?? []) {
    const row = raw as ProfileSummaryRow;
    if (row.created_at) memberSinceBySeller.set(row.id, row.created_at);
  }

  const verifiedSellerIds = new Set<string>();
  if (!mpResult.error) {
    for (const raw of mpResult.data ?? []) {
      const row = raw as { seller_id: string | null };
      if (row.seller_id) verifiedSellerIds.add(row.seller_id);
    }
  }

  const out: Record<string, SellerReputationSummary> = {};
  for (const sellerId of uniqueSellerIds) {
    out[sellerId] = buildSellerReputationSummary({
      sellerId,
      ratings: ratingsBySeller.get(sellerId) ?? [],
      completedSalesCount: completedBySeller.get(sellerId) ?? 0,
      disputeCount: disputesBySeller.get(sellerId) ?? 0,
      verifiedSeller: verifiedSellerIds.has(sellerId),
      memberSince: memberSinceBySeller.get(sellerId),
    });
  }

  return out;
}

export function mapRatingRow(row: RatingRow): RatingRecord {
  return {
    id: row.id,
    sellerId: row.seller_id,
    raterId: row.metadata.rater_id ?? "",
    transactionId: row.metadata.transaction_id ?? "",
    stars: Number(row.metadata.stars ?? row.score_delta),
    comment: row.metadata.comment ?? null,
    createdAt: row.created_at,
  };
}

function emptySummary(sellerId: string): SellerReputationSummary {
  return buildSellerReputationSummary({
    sellerId,
    ratings: [],
    completedSalesCount: 0,
    disputeCount: 0,
    verifiedSeller: false,
  });
}
