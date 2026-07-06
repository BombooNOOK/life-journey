import { describe, expect, it } from "vitest";

import { DEFAULT_OFFICIAL_LAUNCH_DATE } from "@/lib/entitlement/officialLaunchDate";
import {
  canCreateJournalEntry,
  canUseContinuedFeatures,
  resolveUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";

const NOW = new Date("2026-06-20T12:00:00.000Z");
const LAUNCH = new Date(`${DEFAULT_OFFICIAL_LAUNCH_DATE}T00:00:00.000Z`);

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
    expect(e.bannerVariant).toBe("none");
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

  it("does not treat canceled subscription as paid", () => {
    const e = resolveUserEntitlement({
      settings: {
        subscriptionStatus: "canceled",
        subscriptionPlan: "light",
        freeTrialStartedAt: daysAgo(30),
      },
      journalEntryCount: 5,
      now: NOW,
    });
    expect(e.tier).toBe("trial_expired");
  });

  it("returns trial_not_started when no journal and no start date", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: null },
      journalEntryCount: 0,
      now: NOW,
    });
    expect(e.tier).toBe("trial_not_started");
    expect(e.canCreateFirstJournal).toBe(true);
    expect(e.canUseContinuedFeatures).toBe(false);
    expect(e.bannerVariant).toBe("none");
    expect(e.showTrialBanner).toBe(false);
    expect(e.denialCode).toBeNull();
  });

  it("returns trial_active for day 1 through 9", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: daysAgo(8) },
      journalEntryCount: 2,
      now: NOW,
    });
    expect(e.tier).toBe("trial_active");
    expect(e.trialDayIndex).toBe(9);
    expect(e.bannerVariant).toBe("none");
    expect(e.canUseContinuedFeatures).toBe(true);
  });

  it("returns trial_warning from day 10 through 14", () => {
    const warning = resolveUserEntitlement({
      settings: { freeTrialStartedAt: daysAgo(9) },
      journalEntryCount: 2,
      now: NOW,
    });
    expect(warning.tier).toBe("trial_warning");
    expect(warning.trialDayIndex).toBe(10);
    expect(warning.bannerVariant).toBe("warning");

    const lastDay = resolveUserEntitlement({
      settings: { freeTrialStartedAt: daysAgo(13) },
      journalEntryCount: 2,
      now: NOW,
    });
    expect(lastDay.tier).toBe("trial_warning");
    expect(lastDay.trialDayIndex).toBe(14);
    expect(lastDay.canUseContinuedFeatures).toBe(true);
  });

  it("returns trial_expired after 14 days", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: daysAgo(14) },
      journalEntryCount: 3,
      now: NOW,
    });
    expect(e.tier).toBe("trial_expired");
    expect(e.trialDayIndex).toBe(15);
    expect(e.canCreateFirstJournal).toBe(false);
    expect(e.bannerVariant).toBe("expired");
  });

  it("uses launch date fallback when journals exist but start date is null", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: null },
      journalEntryCount: 3,
      now: NOW,
    });
    expect(e.trialDayIndex).toBeGreaterThan(1);
    expect(e.tier).not.toBe("trial_not_started");
  });

  it("treats launch date as start for backfilled existing users", () => {
    const e = resolveUserEntitlement({
      settings: { freeTrialStartedAt: LAUNCH },
      journalEntryCount: 10,
      now: new Date("2026-06-23T12:00:00.000Z"),
    });
    expect(e.tier).toBe("trial_warning");
    expect(e.trialDayIndex).toBe(14);
  });
});

describe("canCreateJournalEntry", () => {
  it("allows first journal during trial_not_started", () => {
    expect(
      canCreateJournalEntry({
        settings: { freeTrialStartedAt: null },
        journalEntryCount: 0,
        now: NOW,
      }),
    ).toBe(true);
  });

  it("blocks journal create when expired", () => {
    expect(
      canCreateJournalEntry({
        settings: { freeTrialStartedAt: daysAgo(20) },
        journalEntryCount: 2,
        now: NOW,
      }),
    ).toBe(false);
  });

  it("allows admin even when trial date is old", () => {
    expect(
      canCreateJournalEntry({
        settings: { isAdmin: true, freeTrialStartedAt: daysAgo(20) },
        journalEntryCount: 2,
        now: NOW,
      }),
    ).toBe(true);
  });
});

describe("canUseContinuedFeatures", () => {
  it("blocks continued features during trial_not_started", () => {
    expect(
      canUseContinuedFeatures({
        settings: { freeTrialStartedAt: null },
        journalEntryCount: 0,
        now: NOW,
      }),
    ).toBe(false);
  });

  it("allows continued features during active trial", () => {
    expect(
      canUseContinuedFeatures({
        settings: { freeTrialStartedAt: daysAgo(3) },
        journalEntryCount: 1,
        now: NOW,
      }),
    ).toBe(true);
  });
});
