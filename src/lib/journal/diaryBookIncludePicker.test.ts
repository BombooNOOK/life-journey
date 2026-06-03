import { describe, expect, it } from "vitest";

import {
  groupDiaryBookIncludePickerEntriesByMonth,
  journalEntryContentExcerpt,
} from "./diaryBookIncludePicker";

describe("diaryBookIncludePicker", () => {
  it("journalEntryContentExcerpt trims and truncates", () => {
    expect(journalEntryContentExcerpt("  hello\nworld  ")).toBe("hello world");
    expect(journalEntryContentExcerpt("あ".repeat(40)).length).toBe(37);
    expect(journalEntryContentExcerpt("あ".repeat(40))).toMatch(/…$/);
    expect(journalEntryContentExcerpt("   ")).toBe("（本文なし）");
  });

  it("groupDiaryBookIncludePickerEntriesByMonth sorts months", () => {
    const buckets = groupDiaryBookIncludePickerEntriesByMonth([
      {
        id: "b",
        createdAt: "2026-07-01T12:00:00.000Z",
        mood: "calm",
        contentExcerpt: "b",
        hasPhoto: false,
        includeInBook: true,
        lengthFlag: "ok",
      },
      {
        id: "a",
        createdAt: "2026-06-15T12:00:00.000Z",
        mood: "happy",
        contentExcerpt: "a",
        hasPhoto: false,
        includeInBook: true,
        lengthFlag: "ok",
      },
    ]);
    expect(buckets.map((b) => b.key)).toEqual(["2026-06", "2026-07"]);
    expect(buckets[0]?.entries.map((e) => e.id)).toEqual(["a"]);
  });
});
