import { describe, expect, it } from "vitest";

import {
  BTN_DRAFT_SAVE,
  BTN_FOOTPRINT_SAVE,
  DONGURI_SHORTAGE_THRESHOLD,
  donguriShortagePreBody,
} from "@/lib/loghouse/donguriFootprintCopy";
import { DONGURI_DIARY_SAVE_COST, donguriReasonLabel } from "@/lib/loghouse/donguriTypes";

describe("donguri footprint copy", () => {
  it("uses 3 acorns for formal save and shortage at 2", () => {
    expect(DONGURI_DIARY_SAVE_COST).toBe(3);
    expect(DONGURI_SHORTAGE_THRESHOLD).toBe(2);
    expect(BTN_FOOTPRINT_SAVE).toBe("森にあしあとを残す");
    expect(BTN_DRAFT_SAVE).toBe("下書きとして残す");
  });

  it("labels diary_save for どんぐり帳", () => {
    expect(donguriReasonLabel("diary_save")).toBe("今日のあしあと");
    expect(donguriReasonLabel("welcome_gift")).toBe("森の住民登録のお祝い");
  });

  it("mentions current balance in pre-gate body", () => {
    expect(donguriShortagePreBody(1)).toContain("1こ");
    expect(donguriShortagePreBody(1)).toContain("下書き");
  });
});
