import { describe, expect, it } from "vitest";

import {
  assertDeletableProfileId,
  evaluateProfileDeleteEligibility,
  findProfileDeleteBlockingDiaryBinding,
  findProfileDeleteBlockingKanteiBinding,
} from "./adminProfileDelete";
import { requiredAdminProfileDeleteConfirmationKeys } from "./adminProfileDeleteTypes";

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

describe("requiredAdminProfileDeleteConfirmationKeys", () => {
  it("requires kantei data confirmation only when creation data exists", () => {
    expect(requiredAdminProfileDeleteConfirmationKeys(false)).not.toContain("kanteiDataReviewed");
    expect(requiredAdminProfileDeleteConfirmationKeys(true)).toContain("kanteiDataReviewed");
  });
});

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

  it("blocks active pending binding", () => {
    const block = findProfileDeleteBlockingKanteiBinding([kanteiRow()]);
    expect(block?.blockSubCode).toBe("BINDING_PENDING_ACTIVE");
  });
});

describe("evaluateProfileDeleteEligibility", () => {
  it("allows delete when only kantei creation data would exist (no binding blocks)", () => {
    expect(
      evaluateProfileDeleteEligibility({
        diaryBindings: [],
        kanteiBindings: [],
      }),
    ).toBeNull();
  });

  it("blocks when base order number exists regardless of status", () => {
    const block = evaluateProfileDeleteEligibility({
      diaryBindings: [diaryRow({ status: "cancelled", baseOrderNumber: "BASE-1", cancelledAt: now })],
      kanteiBindings: [],
      now,
    });
    expect(block?.code).toBe("BASE_ORDER_NUMBER_EXISTS");
    expect(block?.message).toContain("BASE注文番号");
  });

  it("allows delete when cancelled diary binding exists without base order", () => {
    expect(
      evaluateProfileDeleteEligibility({
        diaryBindings: [diaryRow({ status: "cancelled", cancelledAt: now })],
        kanteiBindings: [],
        now,
      }),
    ).toBeNull();
  });

  it("blocks active diary binding with commerce message", () => {
    const block = evaluateProfileDeleteEligibility({
      diaryBindings: [diaryRow()],
      kanteiBindings: [],
      now,
    });
    expect(block?.code).toBe("DIARY_BINDING_BLOCKED");
    expect(block?.message).toContain("製本申込");
    expect(block?.blockingDiaryBinding?.requestId).toBe("d1");
  });

  it("blocks kantei binding when diary bindings are clear", () => {
    const block = evaluateProfileDeleteEligibility({
      diaryBindings: [],
      kanteiBindings: [kanteiRow()],
    });
    expect(block?.code).toBe("KANTEI_BINDING_BLOCKED");
    expect(block?.blockingKanteiBinding?.requestId).toBe("k1");
  });
});
