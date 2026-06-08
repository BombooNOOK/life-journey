import { describe, expect, it } from "vitest";

import {
  assertDeletableProfileId,
  evaluateProfileDeleteEligibility,
  findBlockingKanteiBookBindingRequest,
} from "./adminProfileDelete";

const now = new Date("2026-06-10T12:00:00.000Z");

describe("assertDeletableProfileId", () => {
  it("rejects empty profile id", () => {
    expect(() => assertDeletableProfileId("")).toThrow("プロフィールIDが空です。");
    expect(() => assertDeletableProfileId("   ")).toThrow("プロフィールIDが空です。");
  });

  it("returns trimmed profile id", () => {
    expect(assertDeletableProfileId("  abc-123  ")).toBe("abc-123");
  });
});

describe("findBlockingKanteiBookBindingRequest", () => {
  it("returns null when only cancelled bindings exist", () => {
    expect(
      findBlockingKanteiBookBindingRequest([
        { id: "1", status: "cancelled", baseOrderNumber: null, kanteiCode: "K-1" },
      ]),
    ).toBeNull();
  });

  it("blocks ordered and in_production statuses", () => {
    expect(
      findBlockingKanteiBookBindingRequest([
        { id: "1", status: "ordered", baseOrderNumber: null, kanteiCode: "K-1" },
      ])?.code,
    ).toBe("KANTEI_BINDING_BLOCKED");
    expect(
      findBlockingKanteiBookBindingRequest([
        { id: "1", status: "shipped", baseOrderNumber: null, kanteiCode: "K-1" },
      ])?.code,
    ).toBe("KANTEI_BINDING_BLOCKED");
  });

  it("blocks pending with base order number", () => {
    const block = findBlockingKanteiBookBindingRequest([
      { id: "1", status: "pending", baseOrderNumber: "BASE-1", kanteiCode: "K-1" },
    ]);
    expect(block?.code).toBe("KANTEI_BINDING_BLOCKED");
  });

  it("blocks active pending binding", () => {
    const block = findBlockingKanteiBookBindingRequest([
      { id: "1", status: "pending", baseOrderNumber: null, kanteiCode: "K-1" },
    ]);
    expect(block?.code).toBe("KANTEI_BINDING_BLOCKED");
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
  });

  it("allows delete when no orders or blocking bindings", () => {
    expect(
      evaluateProfileDeleteEligibility({
        orderCount: 0,
        diaryBindings: [],
        kanteiBindings: [],
      }),
    ).toBeNull();
  });

  it("blocks active diary binding", () => {
    const block = evaluateProfileDeleteEligibility({
      orderCount: 0,
      diaryBindings: [
        {
          id: "d1",
          status: "pending",
          baseOrderNumber: null,
          createdAt: new Date("2026-06-09T12:00:00.000Z"),
          diaryBindingCode: "LJD-1",
        },
      ],
      kanteiBindings: [],
      now,
    });
    expect(block?.code).toBe("DIARY_BINDING_BLOCKED");
  });
});
