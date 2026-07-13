import { describe, expect, it } from "vitest";

import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { resolveFirstVisitResumeHref } from "@/lib/onboarding/firstVisitWizard/resumeNavigation";

describe("resolveFirstVisitResumeHref", () => {
  it("returns path-guide for guests without chapter progress", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "guest",
        savedStage: "owl",
        bookshelfKanteiGuide: false,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.pathGuide);
  });

  it("resumes guests mid chapter 1", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "guest",
        savedStage: "loghouse-sign",
        bookshelfKanteiGuide: false,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.loghouseSign);
  });

  it("sends hasKantei users to path-guide (life-path peek removed)", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "hasKantei",
        savedStage: "welcome",
        bookshelfKanteiGuide: true,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.pathGuide);
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

  it("sends logged-in users without mid-flow flags to path-guide", () => {
    expect(
      resolveFirstVisitResumeHref({
        branch: "needsKantei",
        savedStage: null,
        bookshelfKanteiGuide: false,
        orderGuide: false,
        fromRegisterHandoff: false,
      }),
    ).toBe(FIRST_VISIT_ROUTES.pathGuide);
  });
});
