import { describe, expect, it } from "vitest";

import { guardianColorNameForEntryDate } from "./guardianColorForEntryDate";
import {
  SAVE_AFTER_ANIMALS,
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

  it("演出合計は約2.75秒", () => {
    expect(SAVE_TRANSITION_TOTAL_MS).toBeGreaterThanOrEqual(2500);
    expect(SAVE_TRANSITION_TOTAL_MS).toBeLessThanOrEqual(3200);
  });

  it("残り時間を計算する", () => {
    const startedAt = 1_000;
    expect(journalSaveTransitionRemainingMs(startedAt, startedAt + 500)).toBe(
      SAVE_TRANSITION_TOTAL_MS - 500,
    );
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
