import { describe, expect, it } from "vitest";
import { computePlatformFeeArs, getPlatformFeeConfig } from "@/lib/shared/platform-fee";

describe("getPlatformFeeConfig", () => {
  it("defaults to no commission", () => {
    expect(getPlatformFeeConfig({})).toEqual({ percent: 0, minArs: 0 });
  });

  it("reads percent and minimum from env", () => {
    expect(
      getPlatformFeeConfig({ PLATFORM_FEE_PERCENT: "3", PLATFORM_FEE_MIN_ARS: "400" }),
    ).toEqual({ percent: 3, minArs: 400 });
  });

  it("ignores invalid or negative values", () => {
    expect(
      getPlatformFeeConfig({ PLATFORM_FEE_PERCENT: "abc", PLATFORM_FEE_MIN_ARS: "-5" }),
    ).toEqual({ percent: 0, minArs: 0 });
  });
});

describe("computePlatformFeeArs", () => {
  it("is zero when the percent is zero, even with a minimum", () => {
    expect(computePlatformFeeArs(25_000, { percent: 0, minArs: 400 })).toBe(0);
  });

  it("applies the percentage, rounded to whole pesos", () => {
    expect(computePlatformFeeArs(25_000, { percent: 3, minArs: 0 })).toBe(750);
    expect(computePlatformFeeArs(1_999, { percent: 1, minArs: 0 })).toBe(20);
  });

  it("applies the minimum on cheap cards but never exceeds the price", () => {
    expect(computePlatformFeeArs(8_000, { percent: 3, minArs: 400 })).toBe(400);
    expect(computePlatformFeeArs(300, { percent: 3, minArs: 400 })).toBe(300);
  });

  it("is zero for invalid prices", () => {
    expect(computePlatformFeeArs(0, { percent: 3, minArs: 400 })).toBe(0);
    expect(computePlatformFeeArs(Number.NaN, { percent: 3, minArs: 400 })).toBe(0);
  });
});
