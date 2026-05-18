import type { FulfillmentStatus } from "@/lib/domain/types";

export type ReputationTier = "new" | "trusted" | "elite";

export type SellerReputationSummary = {
  sellerId: string;
  averageRating: number;
  ratingCount: number;
  /** Backward-compatible aliases while existing screens migrate. */
  average: number;
  count: number;
  completedSalesCount: number;
  disputeCount: number;
  disputeRate: number;
  tier: ReputationTier;
  verifiedSeller: boolean;
  memberSince?: string;
};

export type RatingRecord = {
  id: string;
  sellerId: string;
  raterId: string;
  transactionId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
};

export type RatingEligibility =
  | { allowed: true }
  | { allowed: false; reason: string; status: 403 | 409 | 422 };

export function calculateAverageRating(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((total, score) => total + score, 0);
  return sum / scores.length;
}

export function calculateDisputeRate(input: {
  disputeCount: number;
  completedSalesCount: number;
}): number {
  if (input.completedSalesCount <= 0) return 0;
  return input.disputeCount / input.completedSalesCount;
}

export function getSellerTier(input: {
  averageRating: number;
  ratingCount: number;
  completedSalesCount: number;
  disputeRate: number;
}): ReputationTier {
  if (input.ratingCount < 3 || input.completedSalesCount < 3) {
    return "new";
  }

  if (
    input.averageRating >= 4.8 &&
    input.ratingCount >= 20 &&
    input.completedSalesCount >= 25 &&
    input.disputeRate <= 0.02
  ) {
    return "elite";
  }

  if (
    input.averageRating >= 4.4 &&
    input.completedSalesCount >= 5 &&
    input.disputeRate <= 0.08
  ) {
    return "trusted";
  }

  return "new";
}

export function canRateTransaction(input: {
  actorUserId: string;
  buyerId?: string | null;
  sellerId?: string | null;
  fulfillmentStatus: FulfillmentStatus;
}): RatingEligibility {
  if (!input.buyerId || !input.sellerId) {
    return {
      allowed: false,
      reason: "La transaccion no tiene comprador o vendedor completo.",
      status: 422,
    };
  }

  if (input.actorUserId !== input.buyerId) {
    return {
      allowed: false,
      reason: "Solo el comprador puede calificar al vendedor.",
      status: 403,
    };
  }

  if (input.fulfillmentStatus !== "delivered") {
    return {
      allowed: false,
      reason: "La compra tiene que estar marcada como entregada antes de calificar.",
      status: 409,
    };
  }

  return { allowed: true };
}

export function buildSellerReputationSummary(input: {
  sellerId: string;
  ratings: number[];
  completedSalesCount: number;
  disputeCount: number;
  verifiedSeller: boolean;
  memberSince?: string;
}): SellerReputationSummary {
  const averageRating = calculateAverageRating(input.ratings);
  const ratingCount = input.ratings.length;
  const disputeRate = calculateDisputeRate({
    disputeCount: input.disputeCount,
    completedSalesCount: input.completedSalesCount,
  });

  return {
    sellerId: input.sellerId,
    averageRating,
    ratingCount,
    average: averageRating,
    count: ratingCount,
    completedSalesCount: input.completedSalesCount,
    disputeCount: input.disputeCount,
    disputeRate,
    tier: getSellerTier({
      averageRating,
      ratingCount,
      completedSalesCount: input.completedSalesCount,
      disputeRate,
    }),
    verifiedSeller: input.verifiedSeller,
    memberSince: input.memberSince,
  };
}
