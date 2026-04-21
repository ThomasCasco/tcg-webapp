import { suggestHybridPrice } from "@/lib/pricing/hybrid-pricing";

type PricingPayload = {
  externalReferenceArs?: number;
  localMedianArs?: number | null;
  conditionMultiplier?: number;
};

export async function POST(request: Request) {
  let payload: PricingPayload;

  try {
    payload = (await request.json()) as PricingPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.externalReferenceArs || payload.externalReferenceArs <= 0) {
    return Response.json(
      {
        error:
          "externalReferenceArs is required and must be greater than 0.",
      },
      { status: 400 },
    );
  }

  const result = suggestHybridPrice({
    externalReferenceArs: payload.externalReferenceArs,
    localMedianArs: payload.localMedianArs ?? null,
    conditionMultiplier: payload.conditionMultiplier ?? 1,
  });

  return Response.json({
    suggestedPriceArs: result.suggestedPriceArs,
    weights: {
      external: result.externalWeight,
      local: result.localWeight,
    },
  });
}