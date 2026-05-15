import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reconcileMpTransaction } from "@/lib/server/mp-reconcile";

// ---------------------------------------------------------------------------
// Mock external dependencies
// ---------------------------------------------------------------------------

vi.mock("@/lib/server/mp-client", () => ({
  getMpPayment: vi.fn(),
  searchMpPaymentByExternalReference: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => ({
  getMpPaymentValidationContext: vi.fn(),
  getPaymentEventByExternalRef: vi.fn(),
  setPaymentMpPaymentId: vi.fn(),
  verifyTransaction: vi.fn(),
}));

vi.mock("@/lib/server/logger", () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import mocked modules so we can control them per test
// ---------------------------------------------------------------------------

import {
  getMpPayment,
  searchMpPaymentByExternalReference,
} from "@/lib/server/mp-client";
import {
  getMpPaymentValidationContext,
  getPaymentEventByExternalRef,
  setPaymentMpPaymentId,
  verifyTransaction,
} from "@/lib/server/repository";

const mockGetPaymentEvent = getPaymentEventByExternalRef as ReturnType<typeof vi.fn>;
const mockGetValidationCtx = getMpPaymentValidationContext as ReturnType<typeof vi.fn>;
const mockGetMpPayment = getMpPayment as ReturnType<typeof vi.fn>;
const mockSearchMpPayment = searchMpPaymentByExternalReference as ReturnType<typeof vi.fn>;
const mockSetPaymentId = setPaymentMpPaymentId as ReturnType<typeof vi.fn>;
const mockVerifyTransaction = verifyTransaction as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const TX_ID = "tx-001";

const pendingPaymentEvent = {
  transactionId: TX_ID,
  verificationStatus: "pending_review",
  providerPaymentId: null,
};

const verifiedPaymentEvent = {
  transactionId: TX_ID,
  verificationStatus: "verified",
  providerPaymentId: "mp-123",
};

const validMpPayment = {
  id: 987654,
  status: "approved",
  transactionAmount: 1500,
  currencyId: "ARS",
  collectorId: 42,
  preferenceId: "pref-abc",
  marketplaceFee: 75,
};

const validContext = {
  expectedAmountArs: "1500",
  expectedCurrencyId: "ARS",
  expectedSellerMpUserId: "42",
  expectedPreferenceId: "pref-abc",
  expectedPlatformFeeArs: 75,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: success path
  mockGetPaymentEvent.mockResolvedValue(pendingPaymentEvent);
  mockGetMpPayment.mockResolvedValue(validMpPayment);
  mockSearchMpPayment.mockResolvedValue(validMpPayment);
  mockGetValidationCtx.mockResolvedValue(validContext);
  mockSetPaymentId.mockResolvedValue(undefined);
  mockVerifyTransaction.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("reconcileMpTransaction", () => {
  describe("not_found path", () => {
    it("returns not_found when no payment_event exists for the transactionId", async () => {
      mockGetPaymentEvent.mockResolvedValue(null);

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("not_found");
      expect((result as { kind: string; reason: string }).reason).toMatch(/no payment_event/);
    });
  });

  describe("already verified path", () => {
    it("returns verified with wasAlreadyVerified=true when event is already verified", async () => {
      mockGetPaymentEvent.mockResolvedValue(verifiedPaymentEvent);

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("verified");
      if (result.kind === "verified") {
        expect(result.wasAlreadyVerified).toBe(true);
        expect(result.mpPaymentId).toBe("mp-123");
      }
    });

    it("does not call getMpPayment when already verified", async () => {
      mockGetPaymentEvent.mockResolvedValue(verifiedPaymentEvent);

      await reconcileMpTransaction({ transactionId: TX_ID });

      expect(mockGetMpPayment).not.toHaveBeenCalled();
      expect(mockSearchMpPayment).not.toHaveBeenCalled();
    });
  });

  describe("MP fetch path", () => {
    it("uses getMpPayment when mpPaymentId option is provided", async () => {
      await reconcileMpTransaction({ transactionId: TX_ID, mpPaymentId: "mp-direct" });

      expect(mockGetMpPayment).toHaveBeenCalledWith("mp-direct");
      expect(mockSearchMpPayment).not.toHaveBeenCalled();
    });

    it("uses searchMpPaymentByExternalReference when no mpPaymentId option", async () => {
      await reconcileMpTransaction({ transactionId: TX_ID });

      expect(mockSearchMpPayment).toHaveBeenCalledWith(TX_ID);
      expect(mockGetMpPayment).not.toHaveBeenCalled();
    });

    it("returns still_pending when MP fetch throws", async () => {
      mockSearchMpPayment.mockRejectedValue(new Error("Network error"));

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("still_pending");
      expect((result as { kind: string; reason: string }).reason).toMatch(
        /could not fetch payment from MP/,
      );
    });

    it("returns still_pending when MP returns null (no payment found yet)", async () => {
      mockSearchMpPayment.mockResolvedValue(null);

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("still_pending");
      expect((result as { kind: string; reason: string }).reason).toMatch(
        /no MP payment found yet/,
      );
    });
  });

  describe("status checks", () => {
    it("returns still_pending for non-approved MP status", async () => {
      mockSearchMpPayment.mockResolvedValue({ ...validMpPayment, status: "pending" });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("still_pending");
      if (result.kind === "still_pending") {
        expect(result.reason).toMatch(/pending/);
      }
    });

    it("returns still_pending for 'rejected' status", async () => {
      mockSearchMpPayment.mockResolvedValue({ ...validMpPayment, status: "rejected" });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("still_pending");
    });

    it("accepts 'accredited' as an approved status", async () => {
      mockSearchMpPayment.mockResolvedValue({ ...validMpPayment, status: "accredited" });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("verified");
    });

    it("accepts status comparison case-insensitively ('APPROVED')", async () => {
      mockSearchMpPayment.mockResolvedValue({ ...validMpPayment, status: "APPROVED" });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("verified");
    });
  });

  describe("hard checks (amount, currency, collector)", () => {
    it("returns blocked when amount mismatches beyond tolerance", async () => {
      mockGetValidationCtx.mockResolvedValue({
        ...validContext,
        expectedAmountArs: "2000", // MP payment is 1500
      });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("blocked");
      if (result.kind === "blocked") {
        expect(result.reason).toMatch(/amount mismatch/);
      }
    });

    it("accepts amounts within the 0.01 ARS tolerance", async () => {
      mockGetValidationCtx.mockResolvedValue({
        ...validContext,
        expectedAmountArs: "1500.005", // within tolerance
      });
      mockSearchMpPayment.mockResolvedValue({ ...validMpPayment, transactionAmount: 1500 });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("verified");
    });

    it("returns blocked when currency mismatches", async () => {
      mockGetValidationCtx.mockResolvedValue({
        ...validContext,
        expectedCurrencyId: "USD",
      });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("blocked");
      if (result.kind === "blocked") {
        expect(result.reason).toMatch(/currency mismatch/);
      }
    });

    it("returns blocked when collector (seller) mismatches", async () => {
      mockGetValidationCtx.mockResolvedValue({
        ...validContext,
        expectedSellerMpUserId: "999", // MP payment has collectorId 42
      });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("blocked");
      if (result.kind === "blocked") {
        expect(result.reason).toMatch(/collector mismatch/);
      }
    });

    it("returns blocked when validation context is missing", async () => {
      mockGetValidationCtx.mockResolvedValue(null);

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("blocked");
      if (result.kind === "blocked") {
        expect(result.reason).toMatch(/missing expected payment context/);
      }
    });
  });

  describe("happy path (full verification)", () => {
    it("returns verified with wasAlreadyVerified=false on fresh verification", async () => {
      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("verified");
      if (result.kind === "verified") {
        expect(result.wasAlreadyVerified).toBe(false);
        expect(result.mpPaymentId).toBe("987654");
      }
    });

    it("calls setPaymentMpPaymentId with the resolved mpPaymentId", async () => {
      await reconcileMpTransaction({ transactionId: TX_ID });

      expect(mockSetPaymentId).toHaveBeenCalledWith({
        transactionId: TX_ID,
        mpPaymentId: "987654",
      });
    });

    it("calls verifyTransaction with correct arguments", async () => {
      await reconcileMpTransaction({ transactionId: TX_ID });

      expect(mockVerifyTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: TX_ID,
          bypassOwnership: true,
          provider: "mercado_pago",
          providerPaymentId: "987654",
          providerStatus: "approved",
        }),
      );
    });

    it("continues to verify even if setPaymentMpPaymentId throws", async () => {
      mockSetPaymentId.mockRejectedValue(new Error("DB write failed"));

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      // Should still verify the transaction
      expect(result.kind).toBe("verified");
      expect(mockVerifyTransaction).toHaveBeenCalled();
    });
  });

  describe("soft checks (preference, fee) – do not block", () => {
    it("does not block when preference IDs differ (soft check)", async () => {
      mockGetValidationCtx.mockResolvedValue({
        ...validContext,
        expectedPreferenceId: "pref-different",
      });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      // Soft check: should still verify
      expect(result.kind).toBe("verified");
    });

    it("does not block when marketplace fee differs (soft check)", async () => {
      mockGetValidationCtx.mockResolvedValue({
        ...validContext,
        expectedPlatformFeeArs: 999, // MP payment has 75
      });

      const result = await reconcileMpTransaction({ transactionId: TX_ID });

      expect(result.kind).toBe("verified");
    });
  });
});
