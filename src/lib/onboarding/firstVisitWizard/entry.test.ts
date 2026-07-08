import { describe, expect, it } from "vitest";

import {
  FIRST_VISIT_ENTRY_HREF,
  isLegacyStandaloneOrderRegisterReturnTo,
} from "@/lib/onboarding/firstVisitWizard/entry";

describe("firstVisitWizard entry", () => {
  it("exposes welcome as the canonical entry href", () => {
    expect(FIRST_VISIT_ENTRY_HREF).toBe("/guide/first/welcome");
  });

  it("detects legacy /order register returnTo", () => {
    expect(isLegacyStandaloneOrderRegisterReturnTo("/order")).toBe(true);
    expect(isLegacyStandaloneOrderRegisterReturnTo("/order?profile=abc")).toBe(true);
    expect(isLegacyStandaloneOrderRegisterReturnTo("/orders")).toBe(false);
    expect(isLegacyStandaloneOrderRegisterReturnTo("/guide/first/loghouse")).toBe(false);
    expect(isLegacyStandaloneOrderRegisterReturnTo(null)).toBe(false);
  });
});
