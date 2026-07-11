import { describe, expect, it } from "vitest";

import { forestGuideMapKanteiHallLink } from "@/lib/help/forestGuideMapKanteiHallLink";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

describe("forestGuideMapKanteiHallLink", () => {
  it("routes guests and users without resident card to welcome", () => {
    expect(forestGuideMapKanteiHallLink("guestOrNoResident")).toEqual({
      branch: "guestOrNoResident",
      href: FIRST_VISIT_ROUTES.pathGuide,
      linkLabel: "はじめての方の案内へ",
    });
  });

  it("routes resident card holders without kantei to kantei-ready", () => {
    expect(forestGuideMapKanteiHallLink("residentNoKantei")).toEqual({
      branch: "residentNoKantei",
      href: FIRST_VISIT_ROUTES.kanteiReady,
      linkLabel: "鑑定のへやへ進む",
    });
  });

  it("routes users with kantei to bookshelf with read label", () => {
    expect(forestGuideMapKanteiHallLink("hasKantei")).toEqual({
      branch: "hasKantei",
      href: "/orders/bookshelf#bookshelf-kantei-books",
      linkLabel: "本棚で鑑定書を見る",
    });
  });
});
