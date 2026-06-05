import { describe, expect, it } from "vitest";

import {
  entryVisibleInDiaryBookSnapshot,
  journalEntryChangedAfterDiaryBookRefresh,
} from "./diaryBookSnapshot";

describe("journalEntryChangedAfterDiaryBookRefresh", () => {
  it("false when updatedAt is on or before book refresh (record date noon is later same day)", () => {
    expect(
      journalEntryChangedAfterDiaryBookRefresh(
        {
          createdAt: "2026-06-05T12:00:00.000Z",
          updatedAt: "2026-06-05T01:30:00.000Z",
        },
        new Date("2026-06-05T01:35:00.000Z"),
      ),
    ).toBe(false);
  });

  it("true when updatedAt is after book refresh", () => {
    expect(
      journalEntryChangedAfterDiaryBookRefresh(
        {
          createdAt: "2026-06-05T12:00:00.000Z",
          updatedAt: "2026-06-05T02:00:00.000Z",
        },
        new Date("2026-06-05T01:35:00.000Z"),
      ),
    ).toBe(true);
  });
});

describe("entryVisibleInDiaryBookSnapshot", () => {
  const asOf = new Date("2026-06-01T12:00:00.000Z");

  it("includes ON entries updated on or before asOf", () => {
    expect(
      entryVisibleInDiaryBookSnapshot(
        {
          includeInBook: true,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-15T12:00:00.000Z",
        },
        asOf,
      ),
    ).toBe(true);
  });

  it("excludes OFF entries", () => {
    expect(
      entryVisibleInDiaryBookSnapshot(
        {
          includeInBook: false,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z",
        },
        asOf,
      ),
    ).toBe(false);
  });

  it("includes entries when record date is later same day but saved before asOf", () => {
    expect(
      entryVisibleInDiaryBookSnapshot(
        {
          includeInBook: true,
          createdAt: "2026-06-01T12:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z",
        },
        new Date("2026-06-01T10:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("excludes entries updated after asOf (record date later than asOf)", () => {
    expect(
      entryVisibleInDiaryBookSnapshot(
        {
          includeInBook: true,
          createdAt: "2026-06-02T12:00:00.000Z",
          updatedAt: "2026-06-02T12:00:00.000Z",
        },
        asOf,
      ),
    ).toBe(false);
  });

  it("excludes entries updated after asOf", () => {
    expect(
      entryVisibleInDiaryBookSnapshot(
        {
          includeInBook: true,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-06-02T12:00:00.000Z",
        },
        asOf,
      ),
    ).toBe(false);
  });
});
