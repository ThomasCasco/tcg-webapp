/**
 * Single source of truth for turning an MP payment into a verified transaction
 * in our DB. Used by:
 *   - the webhook (`/api/webhooks/mercadopago`)
 *   - the post-redirect fallback (transactions page when ?mp_status=success&tx=...)
 *   - any future cron / manual tool
 *
 * Hard checks (amount, currency, collector) block verification. Soft checks
 * (fee, preference) are downgraded to warnings — the money already moved on
 * MP's side and we must not strand the buyer/seller because of accounting
 * quirks (e.g. marketplace_fee=0 when buyer and seller share the OAuth-app
 * owner, or preference_id rotation across retries).
 */

import {
  getMpPayment,
  searchMpPaymentByExternalReference,
  type MpPaymentInfo,
} from "@/lib/server/mp-client";
import {
  getMpPaymentValidationContext,
  getPaymentEventByExternalRef,
  setPaymentMpPaymentId,
  verifyTransaction,
} from "@/lib/server/repository";
import { log } from "@/lib/server/logger";

const MONEY_TOLERANCE_ARS = 0.01;

export type ReconcileOutcome =
  | { kind: "verified"; mpPaymentId: string }
  | { kind: "still_pending"; reason: string }
  | { kind: "not_found"; reason: string }
  | { kind: "blocked"; reason: string };

export async function reconcileMpTransaction(opts: {
  transactionId: string;
  /** If we already know the MP payment id (e.g. from webhook), skip the search. */
  mpPaymentId?: string;
}): Promise<ReconcileOutcome> {
  const { transactionId } = opts;

  const paymentEvent = await getPaymentEventByExternalRef(transactionId);
  if (!paymentEvent) {
    return { kind: "not_found", reason: "no payment_event for transactionId" };
  }
  if (paymentEvent.verificationStatus === "verified") {
    return {
      kind: "verified",
      mpPaymentId: paymentEvent.providerPaymentId ?? "",
    };
  }

  let mpPayment: MpPaymentInfo | null = null;
  try {
    if (opts.mpPaymentId) {
      mpPayment = await getMpPayment(opts.mpPaymentId);
    } else {
      mpPayment = await searchMpPaymentByExternalReference(transactionId);
    }
  } catch (err) {
    log.error("reconcileMpTransaction: MP fetch failed", {
      transactionId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      kind: "still_pending",
      reason: "could not fetch payment from MP",
    };
  }

  if (!mpPayment) {
    return {
      kind: "still_pending",
      reason: "no MP payment found yet for external_reference",
    };
  }

  const status = mpPayment.status.toLowerCase();
  const approved = status === "approved" || status === "accredited";
  if (!approved) {
    return {
      kind: "still_pending",
      reason: `MP payment status is "${mpPayment.status}"`,
    };
  }

  const validationError = await runHardChecks(transactionId, mpPayment);
  if (validationError) {
    log.error("reconcileMpTransaction: hard validation failed", {
      transactionId,
      mpPaymentId: String(mpPayment.id),
      error: validationError,
    });
    return { kind: "blocked", reason: validationError };
  }

  const mpPaymentIdStr = String(mpPayment.id);

  try {
    await setPaymentMpPaymentId({
      transactionId,
      mpPaymentId: mpPaymentIdStr,
    });
  } catch (err) {
    log.error("reconcileMpTransaction: setPaymentMpPaymentId failed", {
      transactionId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await verifyTransaction({
    transactionId,
    bypassOwnership: true,
    provider: "mercado_pago",
    providerPaymentId: mpPaymentIdStr,
    providerStatus: mpPayment.status,
  });

  log.info("reconcileMpTransaction: verified", {
    transactionId,
    mpPaymentId: mpPaymentIdStr,
  });

  return { kind: "verified", mpPaymentId: mpPaymentIdStr };
}

async function runHardChecks(
  transactionId: string,
  mpPayment: MpPaymentInfo,
): Promise<string | null> {
  const expected = await getMpPaymentValidationContext(transactionId);
  if (!expected) return "missing expected payment context";

  const expectedAmount = Number(expected.expectedAmountArs);
  if (Math.abs(mpPayment.transactionAmount - expectedAmount) > MONEY_TOLERANCE_ARS) {
    return `amount mismatch: expected ${expectedAmount}, got ${mpPayment.transactionAmount}`;
  }

  if (mpPayment.currencyId !== expected.expectedCurrencyId) {
    return `currency mismatch: expected ${expected.expectedCurrencyId}, got ${mpPayment.currencyId}`;
  }

  if (String(mpPayment.collectorId) !== expected.expectedSellerMpUserId) {
    return `collector mismatch: expected ${expected.expectedSellerMpUserId}, got ${mpPayment.collectorId}`;
  }

  // Soft checks → log only.
  if (
    expected.expectedPreferenceId &&
    mpPayment.preferenceId &&
    mpPayment.preferenceId !== expected.expectedPreferenceId
  ) {
    log.warn("reconcileMpTransaction: preference mismatch (soft)", {
      transactionId,
      expected: expected.expectedPreferenceId,
      got: mpPayment.preferenceId,
    });
  }
  if (
    typeof expected.expectedPlatformFeeArs === "number" &&
    Math.abs(mpPayment.marketplaceFee - expected.expectedPlatformFeeArs) > MONEY_TOLERANCE_ARS
  ) {
    log.warn("reconcileMpTransaction: marketplace_fee mismatch (soft)", {
      transactionId,
      expected: expected.expectedPlatformFeeArs,
      got: mpPayment.marketplaceFee,
    });
  }

  return null;
}
