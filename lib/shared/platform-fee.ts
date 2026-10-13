/**
 * Single source of truth for the platform commission.
 *
 * Configured with PLATFORM_FEE_PERCENT (default 0: no commission during the
 * launch period) and PLATFORM_FEE_MIN_ARS (default 0). Read the config on the
 * server and pass it to client components as props.
 */

export type PlatformFeeConfig = {
  percent: number;
  minArs: number;
};

function parseNonNegative(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function getPlatformFeeConfig(
  env: Record<string, string | undefined> = process.env,
): PlatformFeeConfig {
  return {
    percent: parseNonNegative(env.PLATFORM_FEE_PERCENT),
    minArs: parseNonNegative(env.PLATFORM_FEE_MIN_ARS),
  };
}

/** Commission in whole pesos, never more than the price itself. */
export function computePlatformFeeArs(priceArs: number, config: PlatformFeeConfig): number {
  if (!Number.isFinite(priceArs) || priceArs <= 0 || config.percent <= 0) return 0;
  const fee = Math.max(config.minArs, Math.round((priceArs * config.percent) / 100));
  return Math.min(Math.round(priceArs), fee);
}
