import { describe, expect, it } from "vitest";
import { formatConditionEs, conditionLabelEs } from "@/lib/shared/condition-labels";

describe("formatConditionEs", () => {
  it("maps each known condition to its Spanish label", () => {
    expect(formatConditionEs("mint")).toBe("Mint (NM+)");
    expect(formatConditionEs("near_mint")).toBe("Casi mint (NM)");
    expect(formatConditionEs("lightly_played")).toBe("Ligeramente jugada (LP)");
    expect(formatConditionEs("moderately_played")).toBe("Moderadamente jugada (MP)");
    expect(formatConditionEs("heavily_played")).toBe("Muy jugada (HP)");
    expect(formatConditionEs("damaged")).toBe("Dañada");
  });

  it("returns the raw value for unknown conditions", () => {
    expect(formatConditionEs("unknown_condition")).toBe("unknown_condition");
    expect(formatConditionEs("")).toBe("");
  });

  it("exports a complete label map for all CardCondition values", () => {
    const expected = [
      "mint",
      "near_mint",
      "lightly_played",
      "moderately_played",
      "heavily_played",
      "damaged",
    ];
    expect(Object.keys(conditionLabelEs).sort()).toEqual(expected.sort());
  });
});
