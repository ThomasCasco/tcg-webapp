/**
 * Reservation window for a Mercado Pago checkout.
 *
 * The MP preference expires after CHECKOUT_WINDOW_MINUTES, so the buyer cannot
 * pay after that. The listing becomes buyable again only after an extra grace
 * period, which leaves time for a payment approved at the very end of the
 * window to reach us through the webhook before someone else reserves.
 *
 * Expiry is evaluated lazily when listings are read or reserved, so it works
 * without a frequent cron (Vercel Hobby only allows one per day).
 */

export const CHECKOUT_WINDOW_MINUTES = 30;
export const RESERVATION_GRACE_MINUTES = 5;
export const RESERVATION_TTL_MINUTES = CHECKOUT_WINDOW_MINUTES + RESERVATION_GRACE_MINUTES;

const MINUTE_MS = 60_000;

export function checkoutExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + CHECKOUT_WINDOW_MINUTES * MINUTE_MS);
}

/** Cutoff timestamp: reservations made before it are expired. */
export function reservationCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - RESERVATION_TTL_MINUTES * MINUTE_MS);
}

/**
 * A reservation without a timestamp (legacy rows) is treated as still held, so
 * we never release a listing whose state we cannot reason about.
 */
export function isReservationExpired(
  reservedAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!reservedAt) return false;
  const reservedMs = new Date(reservedAt).getTime();
  if (!Number.isFinite(reservedMs)) return false;
  return reservedMs <= reservationCutoff(now).getTime();
}
