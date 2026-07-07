import { describe, expect, it } from "vitest";

import { forestGuideMapKanteiHallLink } from "@/lib/help/forestGuideMapKanteiHallLink";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

describe("forestGuideMapKanteiHallLink", () => {
  it("routes guests and users without resident card to welcome", () => {
    expect(forestGuideMapKanteiHallLink("guestOrNoResident")).toEqual({
      href: FIRST_VISIT_ROUTES.welcome,
      linkLabel: "はじめての方の案内へ",
    });
  });

  it("routes resident card holders without kantei to kantei-ready sign", () => {
    expect(forestGuideMapKanteiHallLink("residentNoKantei")).toEqual({
      href: FIRST_VISIT_ROUTES.kanteiReady,
      linkLabel: "鑑定のへやへの案内を見る",
    });
  });

  it("routes users with kantei to bookshelf results", () => {
    expect(forestGuideMapKanteiHallLink("hasKantei")).toEqual({
      href: "/orders/bookshelf#bookshelf-kantei-books",
      linkLabel: "鑑定結果を見る",
    });
  });
});
