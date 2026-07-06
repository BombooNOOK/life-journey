import { describe, expect, it } from "vitest";

import {
  FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
  deriveForestResidentDisplayName,
  formatForestResidentNumber,
  formatForestResidentRegisteredLabel,
  parseForestResidentSequence,
} from "@/lib/forestResident/forestResidentNumber";

describe("forestResidentNumber", () => {
  it("formats BN- sequence with zero padding", () => {
    expect(formatForestResidentNumber(802_079)).toBe("BN-000802079");
    expect(formatForestResidentNumber(802_080)).toBe("BN-000802080");
  });

  it("parses BN- sequence", () => {
    expect(parseForestResidentSequence("BN-000802079")).toBe(802_079);
    expect(parseForestResidentSequence("LJR-20260706-ABCD")).toBeNull();
  });

  it("formats registration label in Asia/Tokyo", () => {
    const date = new Date("2026-07-05T15:00:00.000Z");
    expect(formatForestResidentRegisteredLabel(date)).toBe("2026年7月6日");
  });

  it("defaults display name to rabbit sample", () => {
    expect(deriveForestResidentDisplayName("risu@example.com", "メイン")).toBe(
      FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
    );
  });

  it("uses nickname when set and not default", () => {
    expect(deriveForestResidentDisplayName("a@example.com", "りさ")).toBe("りさ");
  });
});
