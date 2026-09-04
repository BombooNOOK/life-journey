import { describe, expect, it } from "vitest";

import {
  evaluateAlreadyCurrentStrictII,
  findLatestRetiredEmail,
  toPublicSameUidEmailTransitionResponse,
} from "@/lib/auth/sameUidEmailTransition";
import {
  isSameUidEmailTransitionEnabled,
  SAME_UID_EMAIL_TRANSITION_FLAG,
} from "@/lib/auth/sameUidEmailTransitionGate";

describe("sameUidEmailTransitionGate", () => {
  it("defaults OFF when absent", () => {
    expect(isSameUidEmailTransitionEnabled({})).toBe(false);
    expect(isSameUidEmailTransitionEnabled({ [SAME_UID_EMAIL_TRANSITION_FLAG]: "" })).toBe(
      false,
    );
  });

  it("accepts YES and 1 only", () => {
    expect(
      isSameUidEmailTransitionEnabled({ [SAME_UID_EMAIL_TRANSITION_FLAG]: "YES" }),
    ).toBe(true);
    expect(
      isSameUidEmailTransitionEnabled({ [SAME_UID_EMAIL_TRANSITION_FLAG]: "1" }),
    ).toBe(true);
    expect(
      isSameUidEmailTransitionEnabled({ [SAME_UID_EMAIL_TRANSITION_FLAG]: "true" }),
    ).toBe(false);
  });
});

describe("Strict-II already_current evaluation", () => {
  const boundAt = new Date("2026-01-01T00:00:00.000Z");
  const t1 = new Date("2026-01-02T00:00:00.000Z");
  const t2 = new Date("2026-01-03T00:00:00.000Z");

  it("E1: expected == primary == session → already_current", () => {
    const primary = {
      id: "p",
      emailNormalized: "b@ljd.invalid",
      status: "primary",
      boundAt,
      retiredAt: null,
    };
    expect(
      evaluateAlreadyCurrentStrictII({
        primary,
        sessionEmail: "b@ljd.invalid",
        expectedPreviousEmail: "b@ljd.invalid",
        rows: [primary],
      }),
    ).toBe("already_current");
  });

  it("E2: expected is latest retired → already_current", () => {
    const primary = {
      id: "p",
      emailNormalized: "b@ljd.invalid",
      status: "primary",
      boundAt: t2,
      retiredAt: null,
    };
    const retiredA = {
      id: "a",
      emailNormalized: "a@ljd.invalid",
      status: "retired",
      boundAt,
      retiredAt: t1,
    };
    expect(
      evaluateAlreadyCurrentStrictII({
        primary,
        sessionEmail: "b@ljd.invalid",
        expectedPreviousEmail: "a@ljd.invalid",
        rows: [primary, retiredA],
      }),
    ).toBe("already_current");
  });

  it("stale: expected older retired while later retired exists → stale_transition", () => {
    const primary = {
      id: "p",
      emailNormalized: "c@ljd.invalid",
      status: "primary",
      boundAt: t2,
      retiredAt: null,
    };
    const retiredA = {
      id: "a",
      emailNormalized: "a@ljd.invalid",
      status: "retired",
      boundAt,
      retiredAt: t1,
    };
    const retiredB = {
      id: "b",
      emailNormalized: "b@ljd.invalid",
      status: "retired",
      boundAt: t1,
      retiredAt: t2,
    };
    expect(
      evaluateAlreadyCurrentStrictII({
        primary,
        sessionEmail: "c@ljd.invalid",
        expectedPreviousEmail: "a@ljd.invalid",
        rows: [primary, retiredA, retiredB],
      }),
    ).toBe("stale_transition");
  });

  it("tied latest retiredAt → ambiguous", () => {
    const primary = {
      id: "p",
      emailNormalized: "c@ljd.invalid",
      status: "primary",
      boundAt: t2,
      retiredAt: null,
    };
    const r1 = {
      id: "a",
      emailNormalized: "a@ljd.invalid",
      status: "retired",
      boundAt,
      retiredAt: t1,
    };
    const r2 = {
      id: "b",
      emailNormalized: "b@ljd.invalid",
      status: "retired",
      boundAt,
      retiredAt: t1,
    };
    expect(findLatestRetiredEmail([r1, r2])).toEqual({ kind: "ambiguous" });
    expect(
      evaluateAlreadyCurrentStrictII({
        primary,
        sessionEmail: "c@ljd.invalid",
        expectedPreviousEmail: "a@ljd.invalid",
        rows: [primary, r1, r2],
      }),
    ).toBe("ambiguous_identity_state");
  });

  it("session != primary → not idempotent branch", () => {
    const primary = {
      id: "p",
      emailNormalized: "a@ljd.invalid",
      status: "primary",
      boundAt,
      retiredAt: null,
    };
    expect(
      evaluateAlreadyCurrentStrictII({
        primary,
        sessionEmail: "b@ljd.invalid",
        expectedPreviousEmail: "a@ljd.invalid",
        rows: [primary],
      }),
    ).toBeNull();
  });
});

describe("toPublicSameUidEmailTransitionResponse", () => {
  it("never includes identityId", () => {
    const r = toPublicSameUidEmailTransitionResponse({
      state: "transitioned",
      identityId: "secret",
    });
    expect(r).toEqual({ code: "ok", state: "transitioned", status: 200 });
    expect(JSON.stringify(r)).not.toContain("secret");
  });

  it("maps conflict states to 409 codes", () => {
    expect(
      toPublicSameUidEmailTransitionResponse({ state: "old_email_mismatch" }),
    ).toEqual({
      code: "old_email_mismatch",
      state: "old_email_mismatch",
      status: 409,
    });
    expect(
      toPublicSameUidEmailTransitionResponse({ state: "stale_transition" }),
    ).toEqual({ code: "stale_transition", state: "stale_transition", status: 409 });
  });
});
