import { describe, it, expect } from "vitest";
import { cn } from "@/lib/ui/cn";

describe("cn", () => {
  it("merges tailwind classes deduplicating conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("ignores falsy values", () => {
    expect(cn("a", undefined, false && "b", null, "c")).toBe("a c");
  });
});
