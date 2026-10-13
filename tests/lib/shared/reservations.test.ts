import { describe, expect, it } from "vitest";
import {
  CHECKOUT_WINDOW_MINUTES,
  RESERVATION_TTL_MINUTES,
  checkoutExpiresAt,
  isReservationExpired,
} from "@/lib/shared/reservations";

const now = new Date("2026-10-13T12:00:00.000Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

describe("reservations", () => {
  it("keeps the grace period after the checkout window", () => {
    expect(RESERVATION_TTL_MINUTES).toBeGreaterThan(CHECKOUT_WINDOW_MINUTES);
  });

  it("checkout expires after the window", () => {
    expect(checkoutExpiresAt(now).getTime() - now.getTime()).toBe(
      CHECKOUT_WINDOW_MINUTES * 60_000,
    );
  });

  it("holds a reservation until the TTL passes", () => {
    expect(isReservationExpired(minutesAgo(CHECKOUT_WINDOW_MINUTES), now)).toBe(false);
    expect(isReservationExpired(minutesAgo(RESERVATION_TTL_MINUTES - 1), now)).toBe(false);
    expect(isReservationExpired(minutesAgo(RESERVATION_TTL_MINUTES), now)).toBe(true);
  });

  it("never expires reservations without a usable timestamp", () => {
    expect(isReservationExpired(null, now)).toBe(false);
    expect(isReservationExpired(undefined, now)).toBe(false);
    expect(isReservationExpired("not-a-date", now)).toBe(false);
  });
});
