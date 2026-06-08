import { describe, expect, it } from "vitest";

import { findBlockingDiaryBookBindingRequest } from "./deleteDiaryBook";

const now = new Date("2026-06-10T12:00:00.000Z");

function row(
  overrides: Partial<{
    status: string;
    baseOrderNumber: string | null;
    createdAt: Date;
    diaryBindingCode: string;
  }> = {},
) {
  return {
    id: "req-1",
    status: "pending",
    baseOrderNumber: null,
    createdAt: new Date("2026-06-09T12:00:00.000Z"),
    diaryBindingCode: "LJD-TEST",
    ...overrides,
  };
}

describe("findBlockingDiaryBookBindingRequest", () => {
  it("returns null when only cancelled or expired bindings exist", () => {
    expect(
      findBlockingDiaryBookBindingRequest(
        [row({ status: "cancelled" }), row({ status: "expired" })],
        now,
      ),
    ).toBeNull();
  });

  it("blocks active pending binding", () => {
    const block = findBlockingDiaryBookBindingRequest([row()], now);
    expect(block?.code).toBe("BINDING_PENDING");
  });

  it("blocks pending with base order number", () => {
    const block = findBlockingDiaryBookBindingRequest(
      [row({ baseOrderNumber: "BASE-123" })],
      now,
    );
    expect(block?.code).toBe("BINDING_ORDERED");
  });

  it("blocks ordered and in_production statuses", () => {
    expect(findBlockingDiaryBookBindingRequest([row({ status: "ordered" })], now)?.code).toBe(
      "BINDING_ORDERED",
    );
    expect(
      findBlockingDiaryBookBindingRequest([row({ status: "in_production" })], now)?.code,
    ).toBe("BINDING_IN_PROGRESS");
    expect(findBlockingDiaryBookBindingRequest([row({ status: "shipped" })], now)?.code).toBe(
      "BINDING_IN_PROGRESS",
    );
  });

  it("ignores stale unpaid pending", () => {
    const block = findBlockingDiaryBookBindingRequest(
      [row({ createdAt: new Date("2026-05-01T12:00:00.000Z") })],
      now,
    );
    expect(block).toBeNull();
  });
});
