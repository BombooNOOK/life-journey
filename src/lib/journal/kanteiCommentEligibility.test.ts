import { describe, expect, it } from "vitest";

import { sanitizeJournalCommentForResponse } from "./kanteiCommentEligibility";

describe("sanitizeJournalCommentForResponse", () => {
  it("returns stored comment even when profile has no kantei order", () => {
    expect(sanitizeJournalCommentForResponse("  復元コメント  ", false)).toBe("復元コメント");
  });

  it("returns null for empty comment", () => {
    expect(sanitizeJournalCommentForResponse(null, true)).toBeNull();
    expect(sanitizeJournalCommentForResponse("", false)).toBeNull();
  });
});
