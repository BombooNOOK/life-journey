import { describe, expect, it } from "vitest";

import { journalReferenceUtcYMD } from "./referenceDateParts";

describe("journalReferenceUtcYMD", () => {
  it("returns calendar parts from API-style UTC noon instants", () => {
    const d = new Date(Date.UTC(2026, 4, 12, 12, 0, 0));
    expect(journalReferenceUtcYMD(d)).toEqual({ year: 2026, month: 5, day: 12 });
  });
});
