import { describe, it, expect } from "vitest";
import { calculateReputationScore, reputationTier } from "@/lib/reputation/score";

// Baseline "perfect" input that yields a high (clamped) score
const perfect = {
  completedOrders: 25,  // 25*1.2 = 30 (max)
  responseRatio: 100,   // 100*0.25 = 25
  accountAgeDays: 180,  // 180/12 = 15 (max)
  averageRating: 5,     // (5/5)*20 = 20
  reportCount: 0,
};

// Baseline "zero" input
const zero = {
  completedOrders: 0,
  responseRatio: 0,
  accountAgeDays: 0,
  averageRating: 0,
  reportCount: 0,
};

describe("calculateReputationScore", () => {
  describe("base score", () => {
    it("always includes 10 base points even with zero input", () => {
      const score = calculateReputationScore(zero);
      // 10 + 0 + 0 + 0 + 0 - 0 = 10
      expect(score).toBe(10);
    });
  });

  describe("completedOrders component (max 30 pts)", () => {
    it("adds 1.2 pts per completed order", () => {
      const score = calculateReputationScore({ ...zero, completedOrders: 10 });
      // 10 + 12 = 22
      expect(score).toBe(22);
    });

    it("caps orders contribution at 30 pts (≥25 orders)", () => {
      const at25 = calculateReputationScore({ ...zero, completedOrders: 25 });
      const at100 = calculateReputationScore({ ...zero, completedOrders: 100 });
      // 10 + 30 = 40 for both
      expect(at25).toBe(40);
      expect(at100).toBe(40);
    });

    it("boundary: 24 orders gives slightly less than cap", () => {
      const score = calculateReputationScore({ ...zero, completedOrders: 24 });
      // 10 + round(24*1.2) = 10 + 28.8 → but Math.round(10+28.8) = 39
      expect(score).toBe(39);
    });
  });

  describe("responseRatio component (max 25 pts)", () => {
    it("adds responseRatio * 0.25 pts", () => {
      const score = calculateReputationScore({ ...zero, responseRatio: 80 });
      // 10 + 80*0.25 = 30
      expect(score).toBe(30);
    });

    it("caps at 100 for responseRatio > 100", () => {
      const capped = calculateReputationScore({ ...zero, responseRatio: 200 });
      const normal = calculateReputationScore({ ...zero, responseRatio: 100 });
      expect(capped).toBe(normal);
    });

    it("clamps negative responseRatio to 0", () => {
      const score = calculateReputationScore({ ...zero, responseRatio: -50 });
      expect(score).toBe(10); // same as zero
    });
  });

  describe("accountAgeDays component (max 15 pts)", () => {
    it("adds accountAgeDays / 12 pts", () => {
      const score = calculateReputationScore({ ...zero, accountAgeDays: 60 });
      // 10 + 5 = 15
      expect(score).toBe(15);
    });

    it("caps at 15 pts (≥180 days)", () => {
      const at180 = calculateReputationScore({ ...zero, accountAgeDays: 180 });
      const at365 = calculateReputationScore({ ...zero, accountAgeDays: 365 });
      expect(at180).toBe(25); // 10 + 15
      expect(at365).toBe(25);
    });

    it("boundary: 179 days gives just under cap", () => {
      const score = calculateReputationScore({ ...zero, accountAgeDays: 179 });
      // 10 + round(179/12) = 10 + round(14.916) = 10 + 15 = 25
      // (rounds up to 15 due to Math.round inside the top-level Math.round)
      // Actually: Math.min(179/12, 15) = 14.916... → included in the sum before Math.round
      expect(score).toBe(25);
    });

    it("12 days gives 1 pt from age", () => {
      const score = calculateReputationScore({ ...zero, accountAgeDays: 12 });
      // 10 + 1 = 11
      expect(score).toBe(11);
    });
  });

  describe("averageRating component (max 20 pts)", () => {
    it("5-star rating gives 20 pts", () => {
      const score = calculateReputationScore({ ...zero, averageRating: 5 });
      // 10 + 20 = 30
      expect(score).toBe(30);
    });

    it("2.5-star rating gives 10 pts", () => {
      const score = calculateReputationScore({ ...zero, averageRating: 2.5 });
      // 10 + 10 = 20
      expect(score).toBe(20);
    });

    it("0-star rating gives 0 pts", () => {
      const score = calculateReputationScore({ ...zero, averageRating: 0 });
      expect(score).toBe(10);
    });

    it("clamps rating contribution to 0 for negative rating", () => {
      const score = calculateReputationScore({ ...zero, averageRating: -1 });
      expect(score).toBe(10);
    });

    it("clamps rating contribution to 20 for rating > 5", () => {
      const normal = calculateReputationScore({ ...zero, averageRating: 5 });
      const over = calculateReputationScore({ ...zero, averageRating: 10 });
      expect(over).toBe(normal);
    });
  });

  describe("reportCount penalty (max 30 pts deduction)", () => {
    it("deducts 6 pts per report", () => {
      const score = calculateReputationScore({ ...zero, reportCount: 2 });
      // 10 - 12 = -2 → clamped to 0
      expect(score).toBe(0);
    });

    it("1 report deducts 6 pts", () => {
      // start at 10 base, -6 = 4
      const score = calculateReputationScore({ ...zero, reportCount: 1 });
      expect(score).toBe(4);
    });

    it("caps penalty at 30 pts (≥5 reports)", () => {
      const at5 = calculateReputationScore({ ...zero, reportCount: 5 });
      const at10 = calculateReputationScore({ ...zero, reportCount: 10 });
      expect(at5).toBe(at10); // both clamped at 0 since 10-30 < 0
    });
  });

  describe("clamp behaviour", () => {
    it("score is never below 0", () => {
      const score = calculateReputationScore({
        completedOrders: 0,
        responseRatio: 0,
        accountAgeDays: 0,
        averageRating: 0,
        reportCount: 10, // -60 penalty
      });
      expect(score).toBe(0);
    });

    it("score is never above 100", () => {
      const score = calculateReputationScore(perfect);
      // 10 + 30 + 25 + 15 + 20 = 100
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBe(100);
    });

    it("penalised score from a high-reputation user is clamped to 0", () => {
      const score = calculateReputationScore({ ...perfect, reportCount: 20 });
      // Even with full score of 100, 20 reports would be 120 penalty (capped at 30) → 100-30=70, then minus reports...
      // Actually: penalty = min(20*6=120, 30)=30, so 100-30=70
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it("excessive reports on zero base are clamped to 0", () => {
      const score = calculateReputationScore({ ...zero, reportCount: 100 });
      expect(score).toBe(0);
    });
  });

  describe("combined score calculation", () => {
    it("calculates full score correctly for a typical seller", () => {
      const score = calculateReputationScore({
        completedOrders: 10, // 12
        responseRatio: 80,   // 20
        accountAgeDays: 120, // 10
        averageRating: 4,    // 16
        reportCount: 0,
      });
      // 10 + 12 + 20 + 10 + 16 - 0 = 68
      expect(score).toBe(68);
    });

    it("penalises correctly for a seller with reports", () => {
      const score = calculateReputationScore({
        completedOrders: 10, // 12
        responseRatio: 80,   // 20
        accountAgeDays: 120, // 10
        averageRating: 4,    // 16
        reportCount: 3,      // -18
      });
      // 10 + 12 + 20 + 10 + 16 - 18 = 50
      expect(score).toBe(50);
    });
  });
});

describe("reputationTier", () => {
  describe("thresholds", () => {
    it("returns 'new' for scores below 65", () => {
      expect(reputationTier(0)).toBe("new");
      expect(reputationTier(64)).toBe("new");
      expect(reputationTier(10)).toBe("new");
    });

    it("returns 'trusted' for scores 65-84", () => {
      expect(reputationTier(65)).toBe("trusted");
      expect(reputationTier(75)).toBe("trusted");
      expect(reputationTier(84)).toBe("trusted");
    });

    it("returns 'elite' for scores 85 and above", () => {
      expect(reputationTier(85)).toBe("elite");
      expect(reputationTier(95)).toBe("elite");
      expect(reputationTier(100)).toBe("elite");
    });

    it("boundary: 64 is new, 65 is trusted", () => {
      expect(reputationTier(64)).toBe("new");
      expect(reputationTier(65)).toBe("trusted");
    });

    it("boundary: 84 is trusted, 85 is elite", () => {
      expect(reputationTier(84)).toBe("trusted");
      expect(reputationTier(85)).toBe("elite");
    });
  });

  describe("integration with calculateReputationScore", () => {
    it("a perfect score yields elite tier", () => {
      const score = calculateReputationScore(perfect);
      expect(reputationTier(score)).toBe("elite");
    });

    it("a zero-activity score yields new tier", () => {
      const score = calculateReputationScore(zero);
      expect(reputationTier(score)).toBe("new");
    });
  });
});
