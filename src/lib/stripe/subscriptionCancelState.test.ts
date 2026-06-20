import { describe, expect, it } from "vitest";

import {
  buildSubscriptionCancelState,
  freeSubscriptionCancelState,
} from "@/lib/stripe/subscriptionCancelState";

describe("buildSubscriptionCancelState", () => {
  it("hides cancel action for free plan", () => {
    const state = freeSubscriptionCancelState({
      subscriptionPlan: null,
      subscriptionStatus: null,
    });
    expect(state.isPaidPlan).toBe(false);
    expect(state.canRequestCancel).toBe(false);
    expect(state.cancelAtPeriodEnd).toBe(false);
  });

  it("shows cancel action for active paid plan", () => {
    const state = buildSubscriptionCancelState({
      settings: {
        subscriptionPlan: "standard",
        subscriptionStatus: "active",
      },
      cancelAtPeriodEnd: false,
      periodEndUnix: 1780243200,
    });
    expect(state.isPaidPlan).toBe(true);
    expect(state.canRequestCancel).toBe(true);
    expect(state.periodEndLabel).toBeTruthy();
  });

  it("shows cancel pending state without cancel button", () => {
    const state = buildSubscriptionCancelState({
      settings: {
        subscriptionPlan: "light",
        subscriptionStatus: "active",
      },
      cancelAtPeriodEnd: true,
      periodEndUnix: 1780243200,
    });
    expect(state.isPaidPlan).toBe(true);
    expect(state.canRequestCancel).toBe(false);
    expect(state.cancelAtPeriodEnd).toBe(true);
  });
});
