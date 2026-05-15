import { describe, expect, it } from "vitest";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";

describe("assertListingLogisticsValid", () => {
  it("accepts shipping with adequate notes", () => {
    expect(() =>
      assertListingLogisticsValid(true, false, "Envío Andreani a todo el país"),
    ).not.toThrow();
  });

  it("accepts pickup with adequate notes", () => {
    expect(() =>
      assertListingLogisticsValid(false, true, "Retiro en Caballito, CABA"),
    ).not.toThrow();
  });

  it("accepts both with adequate notes", () => {
    expect(() =>
      assertListingLogisticsValid(true, true, "Envío o retiro en CABA"),
    ).not.toThrow();
  });

  it("rejects when neither shipping nor pickup offered", () => {
    expect(() =>
      assertListingLogisticsValid(false, false, "alguna nota larga"),
    ).toThrow(/envío.+retiro/i);
  });

  it("rejects when notes too short", () => {
    expect(() => assertListingLogisticsValid(true, false, "corto")).toThrow(
      /8 caracteres/,
    );
  });

  it("treats null/undefined notes as empty", () => {
    expect(() => assertListingLogisticsValid(true, false, null)).toThrow(
      /8 caracteres/,
    );
    expect(() => assertListingLogisticsValid(true, false, undefined)).toThrow(
      /8 caracteres/,
    );
  });

  it("trims notes before measuring length", () => {
    expect(() => assertListingLogisticsValid(true, false, "       ")).toThrow(
      /8 caracteres/,
    );
  });
});
