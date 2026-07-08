import { describe, expect, it } from "vitest";

import {
  isFirstVisitSwipeBackAllowed,
  shouldBlockFirstVisitSwipeBack,
} from "@/lib/onboarding/firstVisitWizard/backBlockPolicy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

describe("backBlockPolicy", () => {
  it("allows swipe back on welcome and intro video", () => {
    expect(isFirstVisitSwipeBackAllowed(FIRST_VISIT_ROUTES.welcome)).toBe(true);
    expect(isFirstVisitSwipeBackAllowed(FIRST_VISIT_ROUTES.about)).toBe(true);
    expect(isFirstVisitSwipeBackAllowed(FIRST_VISIT_ROUTES.owl)).toBe(false);
  });

  it("blocks swipe back on later wizard steps", () => {
    expect(shouldBlockFirstVisitSwipeBack(FIRST_VISIT_ROUTES.roadmap)).toBe(true);
    expect(shouldBlockFirstVisitSwipeBack(FIRST_VISIT_ROUTES.residentCard)).toBe(true);
    expect(shouldBlockFirstVisitSwipeBack(FIRST_VISIT_ROUTES.welcome)).toBe(false);
    expect(shouldBlockFirstVisitSwipeBack("/orders")).toBe(false);
  });
});
