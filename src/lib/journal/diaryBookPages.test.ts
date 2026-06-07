import { describe, expect, it } from "vitest";

import { isDiaryBookRightPage } from "./diaryBookBindingLayout";
import {
  buildBoundDiaryBookPages,
  compareBoundDiaryEntriesChronological,
  monthNeedsBodyOddAdjustment,
  monthsInDiaryBookPeriod,
} from "./diaryBookPages";

const sampleEntry = {
  id: "e1",
  content: "a",
  createdAt: "2025-10-15T03:00:00.000Z",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  photoDataUrl: null,
  generatedComment: null,
} as const;

function monthIndexPageNumbers(pages: ReturnType<typeof buildBoundDiaryBookPages>): number[] {
  return pages
    .map((p, i) => (p.kind === "month-index" ? i + 1 : null))
    .filter((n): n is number => n != null);
}

describe("monthNeedsBodyOddAdjustment", () => {
  it("non-final month: odd entry count", () => {
    expect(monthNeedsBodyOddAdjustment(1, false)).toBe(true);
    expect(monthNeedsBodyOddAdjustment(2, false)).toBe(false);
  });

  it("final month: even entry count (inverted due to free-writing tail)", () => {
    expect(monthNeedsBodyOddAdjustment(1, true)).toBe(false);
    expect(monthNeedsBodyOddAdjustment(2, true)).toBe(true);
  });
});

describe("compareBoundDiaryEntriesChronological", () => {
  it("sorts same record day by updatedAt ascending", () => {
    const sameDay = "2026-06-05T03:00:00.000Z";
    const older = {
      ...sampleEntry,
      id: "e-older",
      createdAt: sameDay,
      updatedAt: "2026-06-05T04:00:00.000Z",
    };
    const newer = {
      ...sampleEntry,
      id: "e-newer",
      createdAt: sameDay,
      updatedAt: "2026-06-05T10:00:00.000Z",
    };
    expect(compareBoundDiaryEntriesChronological(older, newer)).toBeLessThan(0);
    expect(compareBoundDiaryEntriesChronological(newer, older)).toBeGreaterThan(0);
  });
});

describe("buildBoundDiaryBookPages", () => {
  it("orders same-day entries oldest-first in body pages", () => {
    const sameDay = "2026-06-05T03:00:00.000Z";
    const pages = buildBoundDiaryBookPages(
      [
        {
          ...sampleEntry,
          id: "e-newer",
          createdAt: sameDay,
          updatedAt: "2026-06-05T10:00:00.000Z",
        },
        {
          ...sampleEntry,
          id: "e-older",
          createdAt: sameDay,
          updatedAt: "2026-06-05T04:00:00.000Z",
        },
      ],
      "2026-06-01",
      "2026-06-30",
    );
    const entryPages = pages.filter((p) => p.kind === "entry");
    expect(entryPages).toHaveLength(2);
    expect(entryPages[0]?.kind === "entry" && entryPages[0].entry.id).toBe("e-older");
    expect(entryPages[1]?.kind === "entry" && entryPages[1].entry.id).toBe("e-newer");
  });
  it("ends with free-writing spread, pre-back illustration, and back cover", () => {
    const pages = buildBoundDiaryBookPages([sampleEntry], "2025-10-01", "2025-10-31");
    const tail = pages.slice(-4).map((p) => p.kind);
    expect(tail).toEqual([
      "free-writing",
      "free-writing",
      "pre-back-cover-illustration",
      "back",
    ]);
    expect(pages.at(-2)?.kind).toBe("pre-back-cover-illustration");
  });

  it("uses month-body-odd for final month with even entry count", () => {
    const pages = buildBoundDiaryBookPages(
      [
        { ...sampleEntry, id: "e1", createdAt: "2025-11-10T03:00:00.000Z" },
        { ...sampleEntry, id: "e2", createdAt: "2025-11-20T03:00:00.000Z" },
      ],
      "2025-10-01",
      "2025-11-30",
    );
    expect(pages.some((p) => p.kind === "final-month-odd-adjustment")).toBe(false);
    expect(
      pages.some(
        (p) =>
          p.kind === "month-body-odd-adjustment" &&
          p.calendarYear === 2025 &&
          p.monthIndex === 10,
      ),
    ).toBe(true);
  });

  it("does not add adjustment for final month with odd entry count", () => {
    const pages = buildBoundDiaryBookPages(
      [{ ...sampleEntry, createdAt: "2025-11-12T03:00:00.000Z" }],
      "2025-10-01",
      "2025-11-30",
    );
    expect(pages.filter((p) => p.kind === "month-body-odd-adjustment")).toHaveLength(0);
  });

  it("adds month-body-odd for non-final month with odd entry count", () => {
    const pages = buildBoundDiaryBookPages(
      [{ ...sampleEntry, createdAt: "2025-10-05T03:00:00.000Z" }],
      "2025-10-01",
      "2025-11-30",
    );
    expect(
      pages.some(
        (p) =>
          p.kind === "month-body-odd-adjustment" &&
          p.calendarYear === 2025 &&
          p.monthIndex === 9,
      ),
    ).toBe(true);
  });

  it("places every month index on the right (even PDF page)", () => {
    const pages = buildBoundDiaryBookPages(
      [
        { ...sampleEntry, id: "e1", createdAt: "2025-10-05T03:00:00.000Z" },
        { ...sampleEntry, id: "e2", createdAt: "2025-11-10T03:00:00.000Z" },
      ],
      "2025-10-01",
      "2025-11-30",
    );
    for (const pageNum of monthIndexPageNumbers(pages)) {
      expect(isDiaryBookRightPage(pageNum)).toBe(true);
    }
  });
});

describe("monthsInDiaryBookPeriod", () => {
  it("lists months across calendar years", () => {
    expect(monthsInDiaryBookPeriod("2025-10-01", "2026-03-31")).toHaveLength(6);
  });
});
