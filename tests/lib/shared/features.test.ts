import { describe, expect, it } from "vitest";
import { frozenPathKind } from "@/lib/shared/features";

const prod = { NODE_ENV: "production" };

describe("frozenPathKind", () => {
  it("redirects frozen pages and blocks their APIs", () => {
    expect(frozenPathKind("/auctions", prod)).toBe("page");
    expect(frozenPathKind("/claims/abc", prod)).toBe("page");
    expect(frozenPathKind("/trade-proposals", prod)).toBe("page");
    expect(frozenPathKind("/profiles", prod)).toBe("page");
    expect(frozenPathKind("/api/auctions/1/bids", prod)).toBe("api");
    expect(frozenPathKind("/api/claims", prod)).toBe("api");
  });

  it("leaves the core flow alone", () => {
    for (const path of ["/", "/market", "/market/abc", "/u/nico", "/transactions/tx_1", "/api/payments/checkout"]) {
      expect(frozenPathKind(path, prod)).toBeNull();
    }
  });

  it("matches whole path segments only", () => {
    expect(frozenPathKind("/profilesx", prod)).toBeNull();
    expect(frozenPathKind("/claimsfoo", prod)).toBeNull();
  });

  it("can be switched back on", () => {
    expect(frozenPathKind("/auctions", { ...prod, ENABLE_SECONDARY_FORMATS: "1" })).toBeNull();
  });

  it("hides the UI kit in production only", () => {
    expect(frozenPathKind("/ui-kit", prod)).toBe("page");
    expect(frozenPathKind("/ui-kit", { NODE_ENV: "development" })).toBeNull();
  });
});
