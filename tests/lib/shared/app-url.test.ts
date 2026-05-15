import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAppUrl } from "@/lib/shared/app-url";

const ENV_KEYS = [
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;

describe("getAppUrl", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("falls back to localhost when no env vars set", () => {
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("prefers APP_URL when set", () => {
    process.env.APP_URL = "https://tcg.example.com";
    expect(getAppUrl()).toBe("https://tcg.example.com");
  });

  it("auto-adds https scheme when missing", () => {
    process.env.APP_URL = "tcg.example.com";
    expect(getAppUrl()).toBe("https://tcg.example.com");
  });

  it("strips trailing slash", () => {
    process.env.APP_URL = "https://tcg.example.com/";
    expect(getAppUrl()).toBe("https://tcg.example.com");
  });

  it("uses NEXT_PUBLIC_APP_URL when APP_URL absent", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://pub.example.com";
    expect(getAppUrl()).toBe("https://pub.example.com");
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL over VERCEL_URL", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "prod.vercel.app";
    process.env.VERCEL_URL = "preview-x.vercel.app";
    expect(getAppUrl()).toBe("https://prod.vercel.app");
  });

  it("uses VERCEL_URL as last resort before localhost", () => {
    process.env.VERCEL_URL = "preview.vercel.app";
    expect(getAppUrl()).toBe("https://preview.vercel.app");
  });
});
