import { describe, expect, it } from "vitest";

import {
  canAdminWithdrawPending,
  DIARY_BOOK_BINDING_PENDING_STALE_DAYS,
  hasBaseOrderNumber,
  isStaleUnpaidPending,
  stalePendingCutoffDate,
} from "./diaryBookBindingPendingLifecycle";

describe("diaryBookBindingPendingLifecycle", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  it("treats unpaid pending older than stale days as stale", () => {
    const createdAt = new Date("2026-06-01T12:00:00.000Z");
    expect(
      isStaleUnpaidPending(
        { status: "pending", baseOrderNumber: null, createdAt },
        now,
      ),
    ).toBe(true);
  });

  it("keeps recent unpaid pending visible", () => {
    const createdAt = new Date("2026-06-08T12:00:00.000Z");
    expect(
      isStaleUnpaidPending(
        { status: "pending", baseOrderNumber: null, createdAt },
        now,
      ),
    ).toBe(false);
  });

  it("never treats rows with BASE order number as stale", () => {
    const createdAt = new Date("2026-01-01T12:00:00.000Z");
    expect(
      isStaleUnpaidPending(
        { status: "pending", baseOrderNumber: "BASE-123", createdAt },
        now,
      ),
    ).toBe(false);
  });

  it("allows admin withdraw only for unpaid pending", () => {
    expect(canAdminWithdrawPending({ status: "pending", baseOrderNumber: null })).toBe(true);
    expect(canAdminWithdrawPending({ status: "pending", baseOrderNumber: "BASE-1" })).toBe(false);
    expect(canAdminWithdrawPending({ status: "ordered", baseOrderNumber: null })).toBe(false);
  });

  it("uses configured stale day window", () => {
    expect(stalePendingCutoffDate(now).toISOString()).toBe(
      new Date("2026-06-03T12:00:00.000Z").toISOString(),
    );
    expect(DIARY_BOOK_BINDING_PENDING_STALE_DAYS).toBe(7);
  });

  it("detects non-empty BASE order numbers", () => {
    expect(hasBaseOrderNumber(" BASE-1 ")).toBe(true);
    expect(hasBaseOrderNumber("")).toBe(false);
    expect(hasBaseOrderNumber(null)).toBe(false);
  });
});
