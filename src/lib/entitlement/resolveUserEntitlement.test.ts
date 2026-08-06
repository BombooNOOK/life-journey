import { describe, expect, it } from "vitest";

import {
  canCreateJournalEntry,
  canUseContinuedFeatures,
  resolveUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";

const NOW = new Date("2026-06-20T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe("resolveUserEntitlement", () => {
  it("returns admin tier without restrictions", () => {
    const e = resolveUserEntitlement({
      settings: { isAdmin: true, freeTrialStartedAt: daysAgo(30) },
      journalEntryCount: 5,
      now: NOW,
    });
    expect(e.tier).toBe("admin");
    expect(e.canUseContinuedFeatures).toBe(true);
    expect(e.hasFullAccess).toBe(true);
    expect(e.bannerVariant).toBe("none");
    expect(e.showTrialBanner).toBe(false);
  });

  it("returns monitor tier without restrictions", () => {
    const e = resolveUserEntitlement({
      settings: { isMonitor: true, freeTrialStartedAt: daysAgo(30) },
      journalEntryCount: 5,
      now: NOW,
    });
    expect(e.tier).toBe("monitor");
    expect(e.canUseContinuedFeatures).toBe(true);
  });

  it("returns subscriber tier for active Stripe subscription", () => {
    const e = resolveUserEntitlement({
      settings: {
        subscriptionStatus: "active",
        subscriptionPlan: "light",
        freeTrialStartedAt: daysAgo(30),
      },
      journalEntryCount: 5,
      now: NOW,
    });
    expect(e.tier).toBe("subscriber");
    expect(e.canUseContinuedFeatures).toBe(true);
  });

  it("treats canceled subscription as free (still fully entitled)", () => {
    const e = resolveUserEntitlement({
      settings: {
        subscriptionStatus: "canceled",
        subscriptionPlan: "light",
        freeTrialStartedAt: daysAgo(30),
      },
      journalEntryCount: 5,
      now: NOW,
    });
    expect(e.tier).toBe("free");
    expect(e.canUseContinuedFeatures).toBe(true);
    expect(e.hasFullAccess).toBe(true);
    expect(e.showTrialBanner).toBe(false);
  });

  it("returns free tier with full access when no journals yet", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: null },
      journalEntryCount: 0,
      now: NOW,
    });
    expect(e.tier).toBe("free");
    expect(e.canCreateFirstJournal).toBe(true);
    expect(e.canUseContinuedFeatures).toBe(true);
    expect(e.hasFullAccess).toBe(true);
  });

  it("ignores old freeTrialStartedAt and still grants free access", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: daysAgo(100) },
      journalEntryCount: 3,
      now: NOW,
    });
    expect(e.tier).toBe("free");
    expect(e.canUseContinuedFeatures).toBe(true);
    expect(e.canCreateFirstJournal).toBe(true);
    expect(e.trialDaysRemaining).toBeNull();
  });
});

describe("canCreateJournalEntry", () => {
  it("allows journal create for free users", () => {
    expect(
      canCreateJournalEntry({
        settings: { freeTrialStartedAt: null },
        journalEntryCount: 0,
        now: NOW,
      }),
    ).toBe(true);
  });

  it("allows journal create even with old trial start date", () => {
    expect(
      canCreateJournalEntry({
        settings: { freeTrialStartedAt: daysAgo(20) },
        journalEntryCount: 2,
        now: NOW,
      }),
    ).toBe(true);
  });
});

describe("canUseContinuedFeatures", () => {
  it("allows continued features for free users with no journals", () => {
    expect(
      canUseContinuedFeatures({
        settings: { freeTrialStartedAt: null },
        journalEntryCount: 0,
        now: NOW,
      }),
    ).toBe(true);
  });
});
