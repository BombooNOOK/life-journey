import { describe, expect, it } from "vitest";

import {
  JOURNAL_SAVE_TRANSITION_LINES,
  journalSaveTransitionDurationMs,
  pickJournalSaveTransitionLine,
} from "./journalSaveTransitionCopy";

describe("journalSaveTransitionCopy", () => {
  it("候補文は20件以上", () => {
    expect(JOURNAL_SAVE_TRANSITION_LINES.length).toBeGreaterThanOrEqual(20);
  });

  it("ランダム文を1件返す", () => {
    const line = pickJournalSaveTransitionLine();
    expect(JOURNAL_SAVE_TRANSITION_LINES).toContain(line);
  });

  it("表示時間は1.8〜2.2秒", () => {
    for (let i = 0; i < 20; i++) {
      const ms = journalSaveTransitionDurationMs();
      expect(ms).toBeGreaterThanOrEqual(1800);
      expect(ms).toBeLessThanOrEqual(2200);
    }
  });
});
