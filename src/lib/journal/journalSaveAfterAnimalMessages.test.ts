import { describe, expect, it } from "vitest";

import { guardianColorNameForEntryDate } from "./guardianColorForEntryDate";
import {
  SAVE_AFTER_ANIMALS,
  SAVE_TRANSITION_PHASE2_MS,
  SAVE_TRANSITION_TOTAL_MS,
  journalSaveTransitionRemainingMs,
  pickSaveAfterAnimalMessage,
} from "./journalSaveAfterAnimalMessages";

describe("journalSaveAfterAnimalMessages", () => {
  it("どうぶつ候補は5種類・各5セリフ", () => {
    expect(SAVE_AFTER_ANIMALS).toHaveLength(5);
    for (const animal of SAVE_AFTER_ANIMALS) {
      expect(animal.messages.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("ランダムで animal と message を返す", () => {
    const pick = pickSaveAfterAnimalMessage();
    expect(pick.name.length).toBeGreaterThan(0);
    expect(pick.message.length).toBeGreaterThan(0);
    expect(pick.imagePath).toContain("diary-book-entry-companion-");
  });

  it("演出合計フォールバックは約6.4秒", () => {
    expect(SAVE_TRANSITION_TOTAL_MS).toBe(6400);
  });

  it("2段目未表示時は保存開始からフォールバック合計まで待つ", () => {
    const startedAt = 1_000;
    expect(journalSaveTransitionRemainingMs(startedAt, null, startedAt + 500)).toBe(
      SAVE_TRANSITION_TOTAL_MS - 500,
    );
  });

  it("2段目表示後は animalShownAt から phase2 分待つ", () => {
    const startedAt = 1_000;
    const animalShownAt = 3_500;
    expect(journalSaveTransitionRemainingMs(startedAt, animalShownAt, 4_000)).toBe(
      SAVE_TRANSITION_PHASE2_MS - 500,
    );
    expect(journalSaveTransitionRemainingMs(startedAt, animalShownAt, 7_500)).toBe(0);
  });
});

describe("guardianColorNameForEntryDate", () => {
  it("記録日からお守りカラー名を返す", () => {
    const color = guardianColorNameForEntryDate({
      birthMonth: 6,
      birthDay: 6,
      entryDateYmd: "2026-04-16",
    });
    expect(color.length).toBeGreaterThan(0);
  });
});
