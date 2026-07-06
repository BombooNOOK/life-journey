import { describe, expect, it } from "vitest";

import {
  FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
  deriveForestResidentDisplayName,
} from "@/lib/forestResident/forestResidentNumber";

describe("deriveForestResidentDisplayName", () => {
  it("prefers custom resident display name", () => {
    expect(deriveForestResidentDisplayName("メイン", "森のりさ")).toBe("森のりさ");
  });

  it("uses nickname when custom name is unset", () => {
    expect(deriveForestResidentDisplayName("りさ", null)).toBe("りさ");
  });

  it("falls back to default rabbit name for default nickname", () => {
    expect(deriveForestResidentDisplayName("メイン", null)).toBe(FOREST_RESIDENT_DEFAULT_DISPLAY_NAME);
  });

  it("clamps long profile nickname", () => {
    expect(deriveForestResidentDisplayName("とても長いプロフィール名です", null)).toBe("とても長いプロフィー");
  });
});
