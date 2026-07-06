import { describe, expect, it } from "vitest";

import {
  FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
  deriveForestResidentDisplayName,
} from "@/lib/forestResident/forestResidentNumber";

describe("deriveForestResidentDisplayName", () => {
  it("uses nickname when set and not default", () => {
    expect(deriveForestResidentDisplayName("a@example.com", "りさ")).toBe("りさ");
  });

  it("falls back to default rabbit name for default nickname", () => {
    expect(deriveForestResidentDisplayName("risu@example.com", "メイン")).toBe(
      FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
    );
  });
});
