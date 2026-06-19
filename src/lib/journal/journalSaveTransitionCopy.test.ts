import { describe, expect, it } from "vitest";

import {
  JOURNAL_SAVE_TRANSITION_LINES,
  JOURNAL_SAVE_TRANSITION_TOTAL_MS,
  journalSaveTransitionRemainingMs,
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

  it("演出開始から合計2秒になるよう残り時間を計算する", () => {
    const startedAt = 1_000;
    expect(journalSaveTransitionRemainingMs(startedAt, 1_500)).toBe(1_500);
    expect(journalSaveTransitionRemainingMs(startedAt, 1_000 + JOURNAL_SAVE_TRANSITION_TOTAL_MS)).toBe(
      0,
    );
    expect(journalSaveTransitionRemainingMs(startedAt, 1_000 + JOURNAL_SAVE_TRANSITION_TOTAL_MS + 500)).toBe(
      0,
    );
  });
});
