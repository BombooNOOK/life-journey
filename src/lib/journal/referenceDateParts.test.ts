import { describe, expect, it } from "vitest";

import { journalEntryDateToIsoDateInput, journalReferenceUtcYMD } from "./referenceDateParts";

describe("journalReferenceUtcYMD", () => {
  it("returns calendar parts from API-style UTC noon instants", () => {
    const d = new Date(Date.UTC(2026, 4, 12, 12, 0, 0));
    expect(journalReferenceUtcYMD(d)).toEqual({ year: 2026, month: 5, day: 12 });
  });
});

describe("journalEntryDateToIsoDateInput", () => {
  it("matches YYYY-MM-DD of the UTC calendar day used for journal storage", () => {
    const d = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
    expect(journalEntryDateToIsoDateInput(d)).toBe("2026-05-14");
  });
});
