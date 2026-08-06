import { describe, expect, it } from "vitest";

import { getDiaryBookEntryV2BodyFontLayout } from "./diaryBookEntryBodyFontLayout";
import {
  bodyFrameSeverityFromLengthFlag,
  getBodyFrameStatusLabel,
  resolveV2BodyFrameSeverity,
} from "./diaryPreviewBodyLineLimits";

describe("body frame severity", () => {
  it("maps length flags to severity", () => {
    expect(bodyFrameSeverityFromLengthFlag("ok")).toBe("ok");
    expect(bodyFrameSeverityFromLengthFlag("soft")).toBe("caution");
    expect(bodyFrameSeverityFromLengthFlag("strong")).toBe("overflow");
  });

  it("uses distinct labels for caution vs overflow", () => {
    expect(getBodyFrameStatusLabel("compact", "caution", false)).toContain("プレビュー");
    expect(getBodyFrameStatusLabel("compact", "overflow", false)).toContain("入りきりません");
  });

  it("aligns v2 char capacity with line capacity for compact", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("compact");
    expect(layout.maxBindingChars).toBe(layout.maxCharsPerLine * layout.maxLines);
    expect(layout.maxCharsPerLine).toBe(40);
    expect(layout.maxLines).toBe(10);
  });

  it("treats one-line excess as caution on v2", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("compact");
    const line = "あ".repeat(layout.maxCharsPerLine);
    const caution = Array.from({ length: layout.maxLines + 1 }, () => line).join("\n");
    const overflow = Array.from({ length: layout.maxLines + 2 }, () => line).join("\n");
    expect(resolveV2BodyFrameSeverity(caution, "compact")).toBe("caution");
    expect(resolveV2BodyFrameSeverity(overflow, "compact")).toBe("overflow");
  });
});
