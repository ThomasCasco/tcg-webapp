import { describe, expect, it } from "vitest";
import {
  buildSellerReputationSummary,
  calculateAverageRating,
  calculateDisputeRate,
  canRateTransaction,
  getSellerTier,
} from "@/lib/domain/reputation";

describe("reputation domain", () => {
  it("calculates average rating and dispute rate", () => {
    expect(calculateAverageRating([])).toBe(0);
    expect(calculateAverageRating([5, 4, 3])).toBe(4);
    expect(calculateDisputeRate({ disputeCount: 0, completedSalesCount: 0 })).toBe(0);
    expect(calculateDisputeRate({ disputeCount: 2, completedSalesCount: 10 })).toBe(0.2);
  });

  it("assigns conservative seller tiers", () => {
    expect(getSellerTier({
      averageRating: 5,
      ratingCount: 2,
      completedSalesCount: 2,
      disputeRate: 0,
    })).toBe("new");

    expect(getSellerTier({
      averageRating: 4.5,
      ratingCount: 5,
      completedSalesCount: 6,
      disputeRate: 0.05,
    })).toBe("trusted");

    expect(getSellerTier({
      averageRating: 4.95,
      ratingCount: 25,
      completedSalesCount: 30,
      disputeRate: 0.01,
    })).toBe("elite");
  });

  it("builds a summary with backwards-compatible aliases", () => {
    const summary = buildSellerReputationSummary({
      sellerId: "seller-1",
      ratings: [5, 4],
      completedSalesCount: 4,
      disputeCount: 1,
      verifiedSeller: true,
      memberSince: "2026-01-01T00:00:00.000Z",
    });

    expect(summary.averageRating).toBe(4.5);
    expect(summary.ratingCount).toBe(2);
    expect(summary.average).toBe(summary.averageRating);
    expect(summary.count).toBe(summary.ratingCount);
    expect(summary.disputeRate).toBe(0.25);
  });

  it("only allows buyers to rate delivered transactions", () => {
    expect(canRateTransaction({
      actorUserId: "buyer-1",
      buyerId: "buyer-1",
      sellerId: "seller-1",
      fulfillmentStatus: "delivered",
    })).toEqual({ allowed: true });

    expect(canRateTransaction({
      actorUserId: "seller-1",
      buyerId: "buyer-1",
      sellerId: "seller-1",
      fulfillmentStatus: "delivered",
    })).toMatchObject({ allowed: false, status: 403 });

    expect(canRateTransaction({
      actorUserId: "buyer-1",
      buyerId: "buyer-1",
      sellerId: "seller-1",
      fulfillmentStatus: "shipped",
    })).toMatchObject({ allowed: false, status: 409 });
  });
});

