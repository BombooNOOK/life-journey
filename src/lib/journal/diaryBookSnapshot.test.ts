import { describe, expect, it } from "vitest";

import { entryVisibleInDiaryBookSnapshot } from "./diaryBookSnapshot";

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

  it("excludes entries created after asOf", () => {
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
