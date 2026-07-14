import { describe, expect, it } from "vitest";

import { resolveLogHouseDeskWritingHref } from "@/lib/loghouse/logHouseDeskWritingChoice";

describe("resolveLogHouseDeskWritingHref", () => {
  const companion = "/journal/with-companion?returnTo=%2Forders";

  it("sends first journal users straight to companion writing", () => {
    expect(
      resolveLogHouseDeskWritingHref({
        firstVisitGuideState: "ready_first_journal",
        companionWritingHref: companion,
      }),
    ).toBe(companion);
  });

  it("opens the writing choice page for returning users", () => {
    expect(
      resolveLogHouseDeskWritingHref({
        firstVisitGuideState: "returning",
        companionWritingHref: companion,
      }),
    ).toBe("/orders/write");
  });

  it("opens the writing choice page when kantei is still needed", () => {
    expect(
      resolveLogHouseDeskWritingHref({
        firstVisitGuideState: "needs_kantei",
        companionWritingHref: companion,
      }),
    ).toBe("/orders/write");
  });
});
