import { describe, expect, it } from "vitest";

import {
  nextLoghouseTourStep,
  shouldOfferLoghouseTour,
  spotlightSpotForTourStep,
} from "@/lib/onboarding/firstVisitWizard/loghouseTour";

describe("loghouseTour", () => {
  it("advances steps in order", () => {
    expect(nextLoghouseTourStep("desk")).toBe("mailbox");
    expect(nextLoghouseTourStep("mailbox")).toBe("bookshelf");
    expect(nextLoghouseTourStep("bookshelf")).toBe("hint");
    expect(nextLoghouseTourStep("hint")).toBe("wrapUp");
    expect(nextLoghouseTourStep("wrapUp")).toBe("inviteWrite");
    expect(nextLoghouseTourStep("inviteWrite")).toBeNull();
  });

  it("maps spotlight spots", () => {
    expect(spotlightSpotForTourStep("desk")).toBe("desk");
    expect(spotlightSpotForTourStep("mailbox")).toBe("mailbox");
    expect(spotlightSpotForTourStep("bookshelf")).toBe("bookshelf");
    expect(spotlightSpotForTourStep("hint")).toBeNull();
    expect(spotlightSpotForTourStep("inviteWrite")).toBe("desk");
  });

  it("offers tour only for first journal after kantei", () => {
    expect(
      shouldOfferLoghouseTour({
        firstVisitGuideState: "ready_first_journal",
        hasKantei: true,
      }),
    ).toBe(true);
    expect(
      shouldOfferLoghouseTour({
        firstVisitGuideState: "ready_first_journal",
        hasKantei: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferLoghouseTour({
        firstVisitGuideState: "returning",
        hasKantei: true,
      }),
    ).toBe(false);
  });
});
