import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/shared/safe-next";

describe("safeNextPath", () => {
  it("keeps internal paths", () => {
    expect(safeNextPath("/market/abc")).toBe("/market/abc");
    expect(safeNextPath("/transactions?mp_status=success")).toBe("/transactions?mp_status=success");
  });

  it("rejects anything that could leave the site", () => {
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("/\\evil.com")).toBeNull();
    expect(safeNextPath("market")).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });
});
