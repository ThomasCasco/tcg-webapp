import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit then blocks", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
  });

  it("uses distinct buckets per key", () => {
    rateLimit("k-a", 1, 60_000);
    expect(rateLimit("k-a", 1, 60_000).allowed).toBe(false);
    expect(rateLimit("k-b", 1, 60_000).allowed).toBe(true);
  });

  it("decrements remaining correctly", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(rateLimit(key, 5, 60_000).remaining).toBe(3);
    expect(rateLimit(key, 5, 60_000).remaining).toBe(2);
  });
});

describe("getRequestIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(getRequestIp(req)).toBe("1.2.3.4");
  });

  it("trims whitespace from forwarded IP", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "  1.2.3.4  ,10.0.0.1" },
    });
    expect(getRequestIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when no forwarded-for", () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "5.6.7.8" } });
    expect(getRequestIp(req)).toBe("5.6.7.8");
  });

  it("returns unknown-ip when no IP headers present", () => {
    const req = new Request("http://x");
    expect(getRequestIp(req)).toBe("unknown-ip");
  });
});
