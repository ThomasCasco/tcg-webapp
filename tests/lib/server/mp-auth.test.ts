import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveMpCredentials,
  getMpCredentials,
  getValidAccessToken,
  deleteMpCredentials,
  getSoonExpiringCredentials,
} from "@/lib/server/mp-auth";

// ---------------------------------------------------------------------------
// Mock Supabase and mp-client
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockNot = vi.fn();
const mockOr = vi.fn();

// We build a chainable mock builder
function makeChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = mockSingle;
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  return chain;
}

const mockFrom = vi.fn();

vi.mock("@/lib/server/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock("@/lib/server/mp-client", () => ({
  refreshMpToken: vi.fn(),
}));

import { refreshMpToken } from "@/lib/server/mp-client";
const mockRefreshMpToken = refreshMpToken as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SELLER_ID = "seller-001";

const credRow = {
  id: "cred-1",
  seller_id: SELLER_ID,
  mp_user_id: "mp-user-42",
  access_token: "acc-token-abc",
  refresh_token: "ref-token-xyz",
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h from now
  scope: "offline_access payments",
  live_mode: true,
  updated_at: new Date().toISOString(),
};

const expectedCred = {
  id: "cred-1",
  sellerId: SELLER_ID,
  mpUserId: "mp-user-42",
  accessToken: "acc-token-abc",
  refreshToken: "ref-token-xyz",
  expiresAt: credRow.expires_at,
  scope: "offline_access payments",
  liveMode: true,
  updatedAt: credRow.updated_at,
};

function setupFrom(handler: (tableName: string) => unknown) {
  mockFrom.mockImplementation((tableName: string) => handler(tableName));
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// saveMpCredentials
// ---------------------------------------------------------------------------

describe("saveMpCredentials", () => {
  it("upserts credentials and returns the mapped SellerMpCredential", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({ data: credRow, error: null });
    chain.upsert = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const result = await saveMpCredentials({
      sellerId: SELLER_ID,
      mpUserId: "mp-user-42",
      accessToken: "acc-token-abc",
      refreshToken: "ref-token-xyz",
      expiresIn: 3600,
      scope: "offline_access payments",
      liveMode: true,
    });

    expect(result).toMatchObject({
      sellerId: SELLER_ID,
      mpUserId: "mp-user-42",
      accessToken: "acc-token-abc",
    });
  });

  it("throws when Supabase returns an error", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "upsert failed" },
    });
    chain.upsert = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    await expect(
      saveMpCredentials({
        sellerId: SELLER_ID,
        mpUserId: "mp-user-42",
        accessToken: "acc-token-abc",
        refreshToken: "ref-token-xyz",
        expiresIn: 3600,
        scope: "offline_access payments",
        liveMode: true,
      }),
    ).rejects.toThrow("upsert failed");
  });
});

// ---------------------------------------------------------------------------
// getMpCredentials
// ---------------------------------------------------------------------------

describe("getMpCredentials", () => {
  it("returns a mapped credential when found", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({ data: credRow, error: null });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const result = await getMpCredentials(SELLER_ID);

    expect(result).toMatchObject(expectedCred);
  });

  it("returns null when record is not found (PGRST116 error)", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const result = await getMpCredentials(SELLER_ID);

    expect(result).toBeNull();
  });

  it("returns null when data is null with no error", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const result = await getMpCredentials(SELLER_ID);

    expect(result).toBeNull();
  });

  it("throws on unexpected Supabase errors", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "500", message: "DB connection error" },
    });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    await expect(getMpCredentials(SELLER_ID)).rejects.toThrow("DB connection error");
  });
});

// ---------------------------------------------------------------------------
// getValidAccessToken
// ---------------------------------------------------------------------------

describe("getValidAccessToken", () => {
  it("returns the access token directly when it is not near expiry", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({ data: credRow, error: null });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const token = await getValidAccessToken(SELLER_ID);

    expect(token).toBe("acc-token-abc");
    expect(mockRefreshMpToken).not.toHaveBeenCalled();
  });

  it("throws when the seller has no MP credentials", async () => {
    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    await expect(getValidAccessToken(SELLER_ID)).rejects.toThrow(
      "Seller has not connected Mercado Pago",
    );
  });

  it("refreshes the token when it expires within 5 minutes", async () => {
    const soonExpiresRow = {
      ...credRow,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 min from now
    };
    const refreshedRow = {
      ...credRow,
      access_token: "new-acc-token",
      refresh_token: "new-ref-token",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    // First call (getMpCredentials inside getValidAccessToken)
    const getChain = makeChain();
    getChain.single = vi.fn().mockResolvedValue({ data: soonExpiresRow, error: null });
    getChain.select = vi.fn().mockReturnValue(getChain);
    getChain.eq = vi.fn().mockReturnValue(getChain);

    // Second call (saveMpCredentials inside getValidAccessToken)
    const saveChain = makeChain();
    saveChain.single = vi.fn().mockResolvedValue({ data: refreshedRow, error: null });
    saveChain.upsert = vi.fn().mockReturnValue(saveChain);
    saveChain.select = vi.fn().mockReturnValue(saveChain);

    // Return different chains per call
    mockFrom
      .mockReturnValueOnce(getChain)
      .mockReturnValueOnce(saveChain);

    mockRefreshMpToken.mockResolvedValue({
      mpUserId: "mp-user-42",
      accessToken: "new-acc-token",
      refreshToken: "new-ref-token",
      expiresIn: 3600,
      scope: "offline_access payments",
      liveMode: true,
    });

    const token = await getValidAccessToken(SELLER_ID);

    expect(mockRefreshMpToken).toHaveBeenCalledWith("ref-token-xyz");
    expect(token).toBe("new-acc-token");
  });

  it("refreshes when expiresAt is null (unknown expiry)", async () => {
    const noExpiryRow = { ...credRow, expires_at: null };
    const refreshedRow = {
      ...credRow,
      access_token: "refreshed-token",
      refresh_token: "refreshed-ref-token",
    };

    const getChain = makeChain();
    getChain.single = vi.fn().mockResolvedValue({ data: noExpiryRow, error: null });
    getChain.select = vi.fn().mockReturnValue(getChain);
    getChain.eq = vi.fn().mockReturnValue(getChain);

    const saveChain = makeChain();
    saveChain.single = vi.fn().mockResolvedValue({ data: refreshedRow, error: null });
    saveChain.upsert = vi.fn().mockReturnValue(saveChain);
    saveChain.select = vi.fn().mockReturnValue(saveChain);

    mockFrom
      .mockReturnValueOnce(getChain)
      .mockReturnValueOnce(saveChain);

    mockRefreshMpToken.mockResolvedValue({
      mpUserId: "mp-user-42",
      accessToken: "refreshed-token",
      refreshToken: "refreshed-ref-token",
      expiresIn: 3600,
      scope: "offline_access payments",
      liveMode: true,
    });

    const token = await getValidAccessToken(SELLER_ID);

    expect(mockRefreshMpToken).toHaveBeenCalled();
    expect(token).toBe("refreshed-token");
  });

  it("throws when refresh token is missing but token needs refresh", async () => {
    const expiredNoRefreshRow = {
      ...credRow,
      expires_at: new Date(Date.now() - 1000).toISOString(), // already expired
      refresh_token: null,
    };

    const chain = makeChain();
    chain.single = vi.fn().mockResolvedValue({ data: expiredNoRefreshRow, error: null });
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    await expect(getValidAccessToken(SELLER_ID)).rejects.toThrow(
      "No refresh token available for seller",
    );
  });
});

// ---------------------------------------------------------------------------
// deleteMpCredentials
// ---------------------------------------------------------------------------

describe("deleteMpCredentials", () => {
  it("calls delete on the correct table and seller_id", async () => {
    const chain = makeChain();
    const deleteFn = vi.fn().mockReturnValue(chain);
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    chain.delete = deleteFn;
    chain.eq = eqFn;
    mockFrom.mockReturnValue(chain);

    await deleteMpCredentials(SELLER_ID);

    expect(mockFrom).toHaveBeenCalledWith("seller_mp_credentials");
    expect(deleteFn).toHaveBeenCalled();
    expect(eqFn).toHaveBeenCalledWith("seller_id", SELLER_ID);
  });

  it("throws when Supabase returns an error", async () => {
    const chain = makeChain();
    const deleteFn = vi.fn().mockReturnValue(chain);
    chain.delete = deleteFn;
    chain.eq = vi.fn().mockResolvedValue({ error: { message: "delete failed" } });
    mockFrom.mockReturnValue(chain);

    await expect(deleteMpCredentials(SELLER_ID)).rejects.toThrow("delete failed");
  });
});

// ---------------------------------------------------------------------------
// getSoonExpiringCredentials
// ---------------------------------------------------------------------------

describe("getSoonExpiringCredentials", () => {
  it("returns mapped credentials for rows returned by Supabase", async () => {
    const chain = makeChain();
    chain.select = vi.fn().mockReturnValue(chain);
    chain.not = vi.fn().mockReturnValue(chain);
    chain.or = vi.fn().mockResolvedValue({ data: [credRow], error: null });
    mockFrom.mockReturnValue(chain);

    const results = await getSoonExpiringCredentials(300);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      sellerId: SELLER_ID,
      accessToken: "acc-token-abc",
    });
  });

  it("returns empty array when no credentials are expiring soon", async () => {
    const chain = makeChain();
    chain.select = vi.fn().mockReturnValue(chain);
    chain.not = vi.fn().mockReturnValue(chain);
    chain.or = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const results = await getSoonExpiringCredentials(300);

    expect(results).toHaveLength(0);
  });

  it("throws when Supabase returns an error", async () => {
    const chain = makeChain();
    chain.select = vi.fn().mockReturnValue(chain);
    chain.not = vi.fn().mockReturnValue(chain);
    chain.or = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "query failed" },
    });
    mockFrom.mockReturnValue(chain);

    await expect(getSoonExpiringCredentials(300)).rejects.toThrow("query failed");
  });

  it("includes credentials with null expires_at in the result", async () => {
    const nullExpiryRow = { ...credRow, expires_at: null };
    const chain = makeChain();
    chain.select = vi.fn().mockReturnValue(chain);
    chain.not = vi.fn().mockReturnValue(chain);
    chain.or = vi.fn().mockResolvedValue({ data: [nullExpiryRow], error: null });
    mockFrom.mockReturnValue(chain);

    const results = await getSoonExpiringCredentials(300);

    expect(results[0].expiresAt).toBeNull();
  });
});
