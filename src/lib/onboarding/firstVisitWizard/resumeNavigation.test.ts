import { describe, expect, it } from "vitest";

import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { resolveFirstVisitResumeHref } from "@/lib/onboarding/firstVisitWizard/resumeNavigation";

describe("resolveFirstVisitResumeHref", () => {
  it("returns welcome for guests", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "guest",
        savedStage: "owl",
        bookshelfKanteiGuide: false,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.welcome);
  });

  it("prioritizes bookshelf guide flag after kantei", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "hasKantei",
        savedStage: "welcome",
        bookshelfKanteiGuide: true,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe("/orders/bookshelf#bookshelf-kantei-books");
  });

  it("maps saved register stage to resident card milestone", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "needsKantei",
        savedStage: "register",
        bookshelfKanteiGuide: false,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.residentCard);
  });

  it("sends fresh logged-in users without kantei to kantei-ready", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "needsKantei",
        savedStage: null,
        bookshelfKanteiGuide: false,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.kanteiReady);
  });
});
