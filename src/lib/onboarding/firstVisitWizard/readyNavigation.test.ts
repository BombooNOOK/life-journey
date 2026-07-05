import { describe, expect, it } from "vitest";

import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";

describe("firstVisitReadyNextHref", () => {
  it("routes guests to resident registration", () => {
    expect(firstVisitReadyNextHref("guest")).toBe("/guide/first/register");
  });

  it("routes logged-in users without kantei to kantei-ready", () => {
    expect(firstVisitReadyNextHref("needsKantei")).toBe("/guide/first/kantei-ready");
  });

  it("routes users with kantei to already-ready", () => {
    expect(firstVisitReadyNextHref("hasKantei")).toBe("/guide/first/already-ready");
  });
});
