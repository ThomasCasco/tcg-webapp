import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "@/lib/server/env-validate";

// ---------------------------------------------------------------------------
// Mock the logger so we can verify calls without side effects
// ---------------------------------------------------------------------------

vi.mock("@/lib/server/logger", () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { log } from "@/lib/server/logger";
const mockLog = log as { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

// ---------------------------------------------------------------------------
// Required env vars for a fully valid configuration
// ---------------------------------------------------------------------------

const VALID_ENV: Record<string, string> = {
  MP_APP_ID: "123",
  MP_CLIENT_SECRET: "secret",
  MP_ACCESS_TOKEN: "mp-token",
  MP_WEBHOOK_SECRET: "webhook-secret",
  APP_URL: "https://example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://xyz.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NODE_ENV: "production",
};

function stubEnvs(envs: Record<string, string>) {
  for (const [key, value] of Object.entries(envs)) {
    vi.stubEnv(key, value);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Development mode (non-production): warns, does not throw
// ---------------------------------------------------------------------------

describe("validateEnv – development / non-production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  it("logs info and does not throw when all required vars are present", () => {
    stubEnvs({
      ...VALID_ENV,
      NODE_ENV: "development",
    });

    expect(() => validateEnv()).not.toThrow();
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("all required environment variables present"),
    );
  });

  it("logs a warning but does not throw when required vars are missing", () => {
    // Only set minimum so MP vars are missing
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    // MP vars intentionally left unset

    expect(() => validateEnv()).not.toThrow();
    expect(mockLog.warn).toHaveBeenCalled();
  });

  it("does not enforce production-only vars in development", () => {
    // Set the required vars but omit production-only ones
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MP_APP_ID", "123");
    vi.stubEnv("MP_CLIENT_SECRET", "secret");
    vi.stubEnv("MP_ACCESS_TOKEN", "mp-token");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    // MP_WEBHOOK_SECRET and APP_URL intentionally omitted

    expect(() => validateEnv()).not.toThrow();
    // In dev with missing vars, we warn — but the key point is no throw
    // and no error-level logs for production-only vars
  });
});

// ---------------------------------------------------------------------------
// Production mode: throws on missing required vars
// ---------------------------------------------------------------------------

describe("validateEnv – production", () => {
  it("does not throw when all required production vars are set", () => {
    stubEnvs(VALID_ENV);

    expect(() => validateEnv()).not.toThrow();
    expect(mockLog.info).toHaveBeenCalled();
  });

  it("throws when MP_APP_ID is missing in production", () => {
    stubEnvs({ ...VALID_ENV, MP_APP_ID: "" });

    expect(() => validateEnv()).toThrow(/Environment validation failed/);
    expect(() => validateEnv()).toThrow(/missing MP_APP_ID/);
  });

  it("throws when MP_CLIENT_SECRET is missing in production", () => {
    stubEnvs({ ...VALID_ENV, MP_CLIENT_SECRET: "" });

    expect(() => validateEnv()).toThrow(/missing MP_CLIENT_SECRET/);
  });

  it("throws when MP_ACCESS_TOKEN is missing in production", () => {
    stubEnvs({ ...VALID_ENV, MP_ACCESS_TOKEN: "" });

    expect(() => validateEnv()).toThrow(/missing MP_ACCESS_TOKEN/);
  });

  it("throws when MP_WEBHOOK_SECRET is missing in production", () => {
    stubEnvs({ ...VALID_ENV, MP_WEBHOOK_SECRET: "" });

    expect(() => validateEnv()).toThrow(/missing MP_WEBHOOK_SECRET/);
  });

  it("throws when APP_URL is missing in production", () => {
    stubEnvs({ ...VALID_ENV, APP_URL: "" });

    expect(() => validateEnv()).toThrow(/missing APP_URL/);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing in production", () => {
    stubEnvs({ ...VALID_ENV, NEXT_PUBLIC_SUPABASE_URL: "" });

    expect(() => validateEnv()).toThrow(/missing NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing in production", () => {
    stubEnvs({ ...VALID_ENV, SUPABASE_SERVICE_ROLE_KEY: "" });

    expect(() => validateEnv()).toThrow(/missing SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("includes all missing vars in the error message", () => {
    stubEnvs({
      ...VALID_ENV,
      MP_APP_ID: "",
      MP_CLIENT_SECRET: "",
    });

    let errorMessage = "";
    try {
      validateEnv();
    } catch (e) {
      errorMessage = (e as Error).message;
    }

    expect(errorMessage).toMatch(/missing MP_APP_ID/);
    expect(errorMessage).toMatch(/missing MP_CLIENT_SECRET/);
  });

  it("logs the error before throwing in production", () => {
    stubEnvs({ ...VALID_ENV, MP_APP_ID: "" });

    try {
      validateEnv();
    } catch {
      // expected
    }

    expect(mockLog.error).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// APP_URL custom validation
// ---------------------------------------------------------------------------

describe("validateEnv – APP_URL custom checks", () => {
  it("does not error when APP_URL is missing entirely (covered by productionOnly check)", () => {
    // In development, missing APP_URL is just a warning, not a custom-check error
    stubEnvs({
      ...VALID_ENV,
      NODE_ENV: "development",
      APP_URL: "",
    });

    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when APP_URL lacks a scheme in production", () => {
    stubEnvs({ ...VALID_ENV, APP_URL: "example.com" });

    expect(() => validateEnv()).toThrow(/APP_URL must include scheme/);
  });

  it("accepts http:// APP_URL in development", () => {
    stubEnvs({
      ...VALID_ENV,
      NODE_ENV: "development",
      APP_URL: "http://localhost:3000",
    });

    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when APP_URL uses http:// in production", () => {
    stubEnvs({ ...VALID_ENV, APP_URL: "http://example.com" });

    expect(() => validateEnv()).toThrow(/APP_URL must use https in production/);
  });

  it("accepts https:// APP_URL in production", () => {
    stubEnvs({ ...VALID_ENV, APP_URL: "https://example.com" });

    expect(() => validateEnv()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Deprecated MERCADO_PAGO_ACCESS_TOKEN check
// ---------------------------------------------------------------------------

describe("validateEnv – deprecated token warning", () => {
  it("warns when MERCADO_PAGO_ACCESS_TOKEN is set but MP_ACCESS_TOKEN is missing", () => {
    stubEnvs({
      ...VALID_ENV,
      NODE_ENV: "development",
      MP_ACCESS_TOKEN: "",
      MERCADO_PAGO_ACCESS_TOKEN: "legacy-token",
    });

    // Should not throw in dev, but the custom check will add a warning
    expect(() => validateEnv()).not.toThrow();
    // The warn is triggered by missing MP_ACCESS_TOKEN (required) in dev
    // and the custom check adds the deprecation error string to the errors array
    expect(mockLog.warn).toHaveBeenCalled();
  });

  it("does not warn about deprecated token when MP_ACCESS_TOKEN is set", () => {
    stubEnvs({
      ...VALID_ENV,
      NODE_ENV: "development",
      MERCADO_PAGO_ACCESS_TOKEN: "legacy-token", // both set
    });

    validateEnv();

    // No warn about deprecated token since MP_ACCESS_TOKEN is present
    // (the custom check returns null when MP_ACCESS_TOKEN is set)
    const warnCalls = mockLog.warn.mock.calls as unknown[][];
    const deprecationWarning = warnCalls.some(
      (args) =>
        typeof args[0] === "string" &&
        args[0].includes("deprecated MERCADO_PAGO_ACCESS_TOKEN"),
    );
    expect(deprecationWarning).toBe(false);
  });
});
