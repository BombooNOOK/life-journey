import { describe, expect, it } from "vitest";

import {
  assertDeletableProfileId,
  evaluateProfileDeleteEligibility,
  findProfileDeleteBlockingDiaryBinding,
  findProfileDeleteBlockingKanteiBinding,
} from "./adminProfileDelete";

const now = new Date("2026-06-10T12:00:00.000Z");

function diaryRow(
  overrides: Partial<{
    id: string;
    status: string;
    baseOrderNumber: string | null;
    createdAt: Date;
    diaryBindingCode: string;
    profileId: string;
    diaryBookId: string | null;
    cancelledAt: Date | null;
    expiredAt: Date | null;
  }> = {},
) {
  return {
    id: "d1",
    diaryBookId: "book-1",
    profileId: "profile-1",
    status: "pending",
    baseOrderNumber: null,
    cancelledAt: null,
    expiredAt: null,
    createdAt: new Date("2026-06-09T12:00:00.000Z"),
    updatedAt: new Date("2026-06-09T12:00:00.000Z"),
    diaryBindingCode: "LJD-TEST",
    ...overrides,
  };
}

function kanteiRow(
  overrides: Partial<{
    id: string;
    status: string;
    baseOrderNumber: string | null;
    kanteiCode: string;
  }> = {},
) {
  return {
    id: "k1",
    orderId: "order-1",
    profileId: "profile-1",
    status: "pending",
    baseOrderNumber: null,
    createdAt: new Date("2026-06-09T12:00:00.000Z"),
    updatedAt: new Date("2026-06-09T12:00:00.000Z"),
    kanteiCode: "K-TEST",
    ...overrides,
  };
}

describe("assertDeletableProfileId", () => {
  it("rejects empty profile id", () => {
    expect(() => assertDeletableProfileId("")).toThrow("プロフィールIDが空です。");
    expect(() => assertDeletableProfileId("   ")).toThrow("プロフィールIDが空です。");
  });

  it("returns trimmed profile id", () => {
    expect(assertDeletableProfileId("  abc-123  ")).toBe("abc-123");
  });
});

describe("findProfileDeleteBlockingDiaryBinding", () => {
  it("returns null when only cancelled or expired bindings without base order exist", () => {
    expect(
      findProfileDeleteBlockingDiaryBinding([
        diaryRow({ status: "cancelled" }),
        diaryRow({ id: "d2", status: "expired", expiredAt: now }),
      ]),
    ).toBeNull();
  });

  it("allows cancelled binding without base order number", () => {
    expect(
      findProfileDeleteBlockingDiaryBinding([
        diaryRow({ status: "cancelled", cancelledAt: now }),
      ]),
    ).toBeNull();
  });

  it("blocks cancelled binding with base order number", () => {
    const block = findProfileDeleteBlockingDiaryBinding([
      diaryRow({ status: "cancelled", baseOrderNumber: "BASE-1", cancelledAt: now }),
    ]);
    expect(block?.blockSubCode).toBe("BINDING_CANCELLED_WITH_BASE_ORDER");
  });

  it("blocks active pending binding", () => {
    const block = findProfileDeleteBlockingDiaryBinding([diaryRow()], now);
    expect(block?.blockSubCode).toBe("BINDING_PENDING_ACTIVE");
  });

  it("blocks pending with base order number", () => {
    const block = findProfileDeleteBlockingDiaryBinding(
      [diaryRow({ baseOrderNumber: "BASE-123" })],
      now,
    );
    expect(block?.blockSubCode).toBe("BINDING_PENDING_WITH_BASE_ORDER");
  });

  it("ignores stale unpaid pending", () => {
    const block = findProfileDeleteBlockingDiaryBinding(
      [diaryRow({ createdAt: new Date("2026-05-01T12:00:00.000Z") })],
      now,
    );
    expect(block).toBeNull();
  });
});

describe("findProfileDeleteBlockingKanteiBinding", () => {
  it("returns null when only cancelled bindings without base order exist", () => {
    expect(
      findProfileDeleteBlockingKanteiBinding([kanteiRow({ status: "cancelled" })]),
    ).toBeNull();
  });

  it("blocks cancelled binding with base order number", () => {
    const block = findProfileDeleteBlockingKanteiBinding([
      kanteiRow({ status: "cancelled", baseOrderNumber: "BASE-1" }),
    ]);
    expect(block?.blockSubCode).toBe("BINDING_CANCELLED_WITH_BASE_ORDER");
  });

  it("blocks active pending binding", () => {
    const block = findProfileDeleteBlockingKanteiBinding([kanteiRow()]);
    expect(block?.blockSubCode).toBe("BINDING_PENDING_ACTIVE");
  });
});

describe("evaluateProfileDeleteEligibility", () => {
  it("blocks when order exists", () => {
    const block = evaluateProfileDeleteEligibility({
      orderCount: 1,
      diaryBindings: [],
      kanteiBindings: [],
    });
    expect(block?.code).toBe("ORDER_EXISTS");
    expect(block?.message).toContain("鑑定作成データ（Order）");
    expect(block?.message).toContain("製本申込");
  });

  it("allows delete when cancelled diary binding exists", () => {
    expect(
      evaluateProfileDeleteEligibility({
        orderCount: 0,
        diaryBindings: [diaryRow({ status: "cancelled", cancelledAt: now })],
        kanteiBindings: [],
        now,
      }),
    ).toBeNull();
  });

  it("blocks active diary binding", () => {
    const block = evaluateProfileDeleteEligibility({
      orderCount: 0,
      diaryBindings: [diaryRow()],
      kanteiBindings: [],
      now,
    });
    expect(block?.code).toBe("DIARY_BINDING_BLOCKED");
    expect(block?.blockingDiaryBinding?.requestId).toBe("d1");
  });

  it("blocks kantei binding when diary bindings are clear", () => {
    const block = evaluateProfileDeleteEligibility({
      orderCount: 0,
      diaryBindings: [],
      kanteiBindings: [kanteiRow()],
    });
    expect(block?.code).toBe("KANTEI_BINDING_BLOCKED");
    expect(block?.blockingKanteiBinding?.requestId).toBe("k1");
  });
});
