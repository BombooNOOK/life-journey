import { describe, expect, it } from "vitest";

import {
  formatJournalListDayLabel,
  groupJournalEntriesByMonth,
  journalEntryListPreviewLine,
} from "@/lib/journal/journalListDisplay";

describe("journalEntryListPreviewLine", () => {
  it("returns first line truncated", () => {
    expect(journalEntryListPreviewLine("一行目\n二行目")).toBe("一行目");
    expect(journalEntryListPreviewLine("a".repeat(60)).endsWith("…")).toBe(true);
  });
});

describe("groupJournalEntriesByMonth", () => {
  it("groups and sorts by month desc then day desc", () => {
    const groups = groupJournalEntriesByMonth([
      { id: "1", content: "a", createdAt: "2026-06-01T12:00:00.000Z" },
      { id: "2", content: "b", createdAt: "2026-06-16T12:00:00.000Z" },
      { id: "3", content: "c", createdAt: "2026-05-20T12:00:00.000Z" },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.monthKey).toBe("2026-06");
    expect(groups[0]?.entries.map((e) => e.id)).toEqual(["2", "1"]);
    expect(groups[1]?.monthKey).toBe("2026-05");
  });
});

describe("formatJournalListDayLabel", () => {
  it("formats day in ja-JP", () => {
    expect(formatJournalListDayLabel("2026-06-16T12:00:00.000Z")).toMatch(/16日/);
  });
});
