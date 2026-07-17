import { describe, expect, it } from "vitest";

import { journalDraftPhotoApiPath } from "@/lib/journal/journalDrafts";

describe("journalDraftPhotoApiPath", () => {
  it("builds photo API path with dateKey and profileId", () => {
    expect(journalDraftPhotoApiPath("2026-07-17", "prof_1")).toBe(
      "/api/journal/drafts/photo?dateKey=2026-07-17&profileId=prof_1",
    );
  });
});
