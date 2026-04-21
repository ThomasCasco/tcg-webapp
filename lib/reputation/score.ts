type ReputationInput = {
  completedOrders: number;
  responseRatio: number;
  accountAgeDays: number;
  averageRating: number;
  reportCount: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateReputationScore(input: ReputationInput): number {
  const ordersScore = Math.min(input.completedOrders * 1.2, 30);
  const responseScore = clamp(input.responseRatio, 0, 100) * 0.25;
  const ageScore = Math.min(input.accountAgeDays / 12, 15);
  const ratingScore = clamp((input.averageRating / 5) * 20, 0, 20);
  const reportPenalty = Math.min(input.reportCount * 6, 30);

  return clamp(
    Math.round(10 + ordersScore + responseScore + ageScore + ratingScore - reportPenalty),
    0,
    100,
  );
}

export function reputationTier(score: number): "new" | "trusted" | "elite" {
  if (score >= 85) {
    return "elite";
  }
  if (score >= 65) {
    return "trusted";
  }
  return "new";
}