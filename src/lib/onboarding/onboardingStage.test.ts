import { describe, expect, it } from "vitest";

import {
  isOnboardingFeatureUnlocked,
  isPathAllowedForStage,
  resolveOnboardingNextStep,
  resolveOnboardingStage,
} from "@/lib/onboarding/onboardingStage";

describe("onboardingStage", () => {
  it("resolves stages in order", () => {
    expect(
      resolveOnboardingStage({
        isLoggedIn: false,
        chapter1Complete: false,
        hasKanteiOrder: false,
        journalEntryCount: 0,
      }),
    ).toBe(0);

    expect(
      resolveOnboardingStage({
        isLoggedIn: true,
        chapter1Complete: false,
        hasKanteiOrder: false,
        journalEntryCount: 0,
      }),
    ).toBe(1);

    expect(
      resolveOnboardingStage({
        isLoggedIn: true,
        chapter1Complete: true,
        hasKanteiOrder: false,
        journalEntryCount: 0,
      }),
    ).toBe(2);

    expect(
      resolveOnboardingStage({
        isLoggedIn: true,
        chapter1Complete: true,
        hasKanteiOrder: true,
        journalEntryCount: 0,
      }),
    ).toBe(3);

    expect(
      resolveOnboardingStage({
        isLoggedIn: true,
        chapter1Complete: false,
        hasKanteiOrder: true,
        journalEntryCount: 0,
      }),
    ).toBe(3);

    expect(
      resolveOnboardingStage({
        isLoggedIn: true,
        chapter1Complete: true,
        hasKanteiOrder: true,
        journalEntryCount: 2,
      }),
    ).toBe(4);
  });

  it("locks diary features until stage 3", () => {
    expect(isOnboardingFeatureUnlocked(2, "bottom_calendar")).toBe(false);
    expect(isOnboardingFeatureUnlocked(2, "bottom_loghouse")).toBe(true);
    expect(isOnboardingFeatureUnlocked(3, "bottom_calendar")).toBe(true);
  });

  it("guards protected paths", () => {
    expect(isPathAllowedForStage("/orders", 1)).toBe(false);
    expect(isPathAllowedForStage("/orders", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/calendar", 2)).toBe(false);
    expect(isPathAllowedForStage("/orders/calendar", 3)).toBe(true);
    expect(isPathAllowedForStage("/help/ljd", 0)).toBe(true);
  });

  it("returns next step until stage 4", () => {
    expect(resolveOnboardingNextStep(4)).toBeNull();
    expect(resolveOnboardingNextStep(2)?.label).toContain("第2章");
  });
});
