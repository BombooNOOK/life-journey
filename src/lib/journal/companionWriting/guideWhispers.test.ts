import { describe, expect, it } from "vitest";

import {
  getCompanionWritingCalendarWhisper,
  getCompanionWritingEditGuideWhisper,
} from "./guideWhispers";

describe("companionWriting guideWhispers", () => {
  it("鑑定士ごとの短いひとことを返す", () => {
    const calendar = getCompanionWritingCalendarWhisper("frog");
    expect(calendar.name).toBe("ケロシオン");
    expect(calendar.message).toContain("森に届き");

    const edit = getCompanionWritingEditGuideWhisper("owl");
    expect(edit.name).toBe("フクロウ先生");
    expect(edit.message).toContain("あしあと");
  });
});
