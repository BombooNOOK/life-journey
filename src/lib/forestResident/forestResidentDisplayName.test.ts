import { describe, expect, it } from "vitest";

import {
  FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH,
  clampForestResidentDisplayName,
  parseForestResidentDisplayNameInput,
} from "@/lib/forestResident/forestResidentDisplayName";

describe("forestResidentDisplayName", () => {
  it("clamps to max length", () => {
    expect(clampForestResidentDisplayName("  あいうえおかきくけこさし  ")).toBe("あいうえおかき");
  });

  it("accepts valid input", () => {
    expect(parseForestResidentDisplayNameInput("  りさ  ")).toEqual({ ok: true, value: "りさ" });
  });

  it("rejects too long input", () => {
    const result = parseForestResidentDisplayNameInput("あ".repeat(FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH + 1));
    expect(result.ok).toBe(false);
  });

  it("allows empty to clear custom name", () => {
    expect(parseForestResidentDisplayNameInput("   ")).toEqual({ ok: true, value: null });
  });
});
