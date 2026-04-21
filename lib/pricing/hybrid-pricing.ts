type HybridPricingInput = {
  externalReferenceArs: number;
  localMedianArs?: number | null;
  conditionMultiplier?: number;
  minFloorArs?: number;
  maxCeilingArs?: number;
};

export type PriceSuggestion = {
  suggestedPriceArs: number;
  externalWeight: number;
  localWeight: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function suggestHybridPrice(input: HybridPricingInput): PriceSuggestion {
  const externalWeight = input.localMedianArs == null ? 1 : 0.4;
  const localWeight = input.localMedianArs == null ? 0 : 0.6;
  const conditionMultiplier = input.conditionMultiplier ?? 1;
  const floor = input.minFloorArs ?? 500;
  const ceiling = input.maxCeilingArs ?? 2_000_000;

  const basePrice =
    input.externalReferenceArs * externalWeight +
    (input.localMedianArs ?? 0) * localWeight;

  const adjusted = basePrice * conditionMultiplier;
  const suggested = Math.round(clamp(adjusted, floor, ceiling));

  return {
    suggestedPriceArs: suggested,
    externalWeight,
    localWeight,
  };
}