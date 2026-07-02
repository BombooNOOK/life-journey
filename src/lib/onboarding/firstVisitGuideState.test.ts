import { describe, expect, it } from "vitest";

import { resolveFirstVisitGuideState } from "./firstVisitGuideState";

describe("resolveFirstVisitGuideState", () => {
  it("needs_kantei when profile has no kantei order", () => {
    expect(
      resolveFirstVisitGuideState({ hasKanteiOrder: false, journalEntryCount: 0 }),
    ).toBe("needs_kantei");
    expect(
      resolveFirstVisitGuideState({ hasKanteiOrder: false, journalEntryCount: 3 }),
    ).toBe("needs_kantei");
  });

  it("ready_first_journal when kantei exists and no journals", () => {
    expect(
      resolveFirstVisitGuideState({ hasKanteiOrder: true, journalEntryCount: 0 }),
    ).toBe("ready_first_journal");
  });

  it("returning when at least one journal exists", () => {
    expect(
      resolveFirstVisitGuideState({ hasKanteiOrder: true, journalEntryCount: 1 }),
    ).toBe("returning");
  });
});
