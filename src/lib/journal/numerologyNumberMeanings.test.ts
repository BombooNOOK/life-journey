import { describe, expect, it } from "vitest";

import {
  DIARY_NUMBER_VALUES,
  NUMEROLOGY_NUMBER_MEANING_ENTRIES,
  NUMEROLOGY_NUMBER_MEANINGS,
  numerologyNumberQuickReferenceLine,
} from "./numerologyNumberMeanings";

describe("numerologyNumberMeanings", () => {
  it("exposes only 1-9 on screen-facing lists", () => {
    expect(DIARY_NUMBER_VALUES).toHaveLength(9);
    expect(NUMEROLOGY_NUMBER_MEANING_ENTRIES).toHaveLength(9);
    expect(NUMEROLOGY_NUMBER_MEANING_ENTRIES.every((e) => e.number >= 1 && e.number <= 9)).toBe(
      true,
    );
    expect(Object.keys(NUMEROLOGY_NUMBER_MEANINGS).map(Number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it("fills required fields for each entry", () => {
    for (const entry of NUMEROLOGY_NUMBER_MEANING_ENTRIES) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.keywords.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.diaryHint.length).toBeGreaterThan(0);
      expect(numerologyNumberQuickReferenceLine(entry)).toContain(String(entry.number));
    }
  });
});
