import { describe, expect, it } from "vitest";

import { buildBoundDiaryBookPages } from "./diaryBookPages";
import { filterEntriesForDiaryBook, isEntryIncludedInDiaryBook } from "./includeInBook";

describe("includeInBook", () => {
  it("treats undefined as included", () => {
    expect(isEntryIncludedInDiaryBook({})).toBe(true);
    expect(isEntryIncludedInDiaryBook({ includeInBook: true })).toBe(true);
    expect(isEntryIncludedInDiaryBook({ includeInBook: false })).toBe(false);
  });

  it("excludes OFF entries from bound diary book pages", () => {
    const included = {
      id: "e1",
      content: "a",
      createdAt: "2025-10-15T03:00:00.000Z",
      mood: "calm",
      activity: "record_anyway",
      companionType: "owl",
      includeInBook: true,
    };
    const excluded = { ...included, id: "e2", includeInBook: false };
    const pagesAll = buildBoundDiaryBookPages([included, excluded], "2025-10-01", "2025-10-31");
    const pagesIncluded = buildBoundDiaryBookPages([included], "2025-10-01", "2025-10-31");
    const entryPagesAll = pagesAll.filter((p) => p.kind === "entry").length;
    const entryPagesIncluded = pagesIncluded.filter((p) => p.kind === "entry").length;
    expect(entryPagesAll).toBe(1);
    expect(entryPagesIncluded).toBe(1);
    expect(filterEntriesForDiaryBook([included, excluded])).toHaveLength(1);
  });
});
