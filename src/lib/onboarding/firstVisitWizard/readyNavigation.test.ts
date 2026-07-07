import { describe, expect, it } from "vitest";

import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";

describe("firstVisitReadyNextHref", () => {
  it("routes guests to the forest guide station", () => {
    expect(firstVisitReadyNextHref("guest")).toBe("/guide/first/guide-station-sign");
  });

  it("routes logged-in users without kantei to resident card", () => {
    expect(firstVisitReadyNextHref("needsKantei")).toBe("/guide/first/resident-card");
  });

  it("routes users with kantei to already-ready", () => {
    expect(firstVisitReadyNextHref("hasKantei")).toBe("/guide/first/already-ready");
  });
});
