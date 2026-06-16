import { describe, expect, it } from "vitest";

import { formatJournalPreviewDateHeading } from "@/lib/journal/journalRecordDateDisplay";

describe("formatJournalPreviewDateHeading", () => {
  it("formats date in Japanese with year month day", () => {
    const label = formatJournalPreviewDateHeading("2026-06-16T12:00:00.000Z");
    expect(label).toMatch(/2026年/);
    expect(label).toMatch(/16日/);
  });
});
