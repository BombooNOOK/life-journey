import { describe, expect, it } from "vitest";

import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  isOnboardingFeatureUnlocked,
  isPathAllowedForStage,
  ONBOARDING_CHAPTER3_DESK_WRITING_HREF,
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
    expect(isPathAllowedForStage("/orders", 0)).toBe(false);
    expect(isPathAllowedForStage("/orders", 1)).toBe(true);
    expect(isPathAllowedForStage("/orders", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/calendar", 2)).toBe(false);
    expect(isPathAllowedForStage("/orders/calendar", 3)).toBe(true);
    expect(isPathAllowedForStage("/orders/write", 2)).toBe(false);
    expect(isPathAllowedForStage("/orders/write", 3)).toBe(true);
    expect(isPathAllowedForStage("/help/ljd", 0)).toBe(true);
    // 住民票・アカウント・設定・お問い合わせは鑑定前でも開ける
    expect(isPathAllowedForStage("/orders/resident-card", 1)).toBe(true);
    expect(isPathAllowedForStage("/orders/resident-card", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/account", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/account/delete", 1)).toBe(true);
    expect(isPathAllowedForStage("/orders/settings", 1)).toBe(true);
    expect(isPathAllowedForStage("/orders/settings/add-profile", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/go-out", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/garden", 2)).toBe(true);
    expect(isPathAllowedForStage("/orders/support", 2)).toBe(true);
    // 実注文ID（詳細・配下）は鑑定後
    expect(isPathAllowedForStage("/orders/clxyz1234567890abcdefgh", 2)).toBe(false);
    expect(isPathAllowedForStage("/orders/clxyz1234567890abcdefgh", 3)).toBe(true);
    expect(isPathAllowedForStage("/orders/clxyz1234567890abcdefgh/today", 2)).toBe(false);
    expect(isPathAllowedForStage("/orders/clxyz1234567890abcdefgh/manage", 2)).toBe(false);
  });

  it("returns next step until stage 4", () => {
    expect(resolveOnboardingNextStep(4)).toBeNull();
    expect(resolveOnboardingNextStep(2)?.label).toContain("第2章");
    expect(resolveOnboardingNextStep(3)?.href).toBe(ONBOARDING_CHAPTER3_DESK_WRITING_HREF);
    expect(resolveOnboardingNextStep(3)?.label).toBe("机であしあとを残す");
    expect(resolveOnboardingNextStep(3, { chapter3Started: true })?.href).toBe(
      ONBOARDING_CHAPTER3_DESK_WRITING_HREF,
    );
    expect(resolveOnboardingNextStep(3, { onCompanionWritingPath: true })).toBeNull();
  });
});
