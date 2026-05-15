import { describe, expect, it } from "vitest";

import { shouldPreserveJournalGeneratedComment } from "./preserveDiaryReading";

describe("shouldPreserveJournalGeneratedComment", () => {
  const base = {
    regenerateOwlComment: false,
    moodUnchanged: true,
    activityUnchanged: true,
    companionUnchanged: true,
    entryDateUnchanged: true,
    hasExistingComment: true,
  };

  it("記録日が変わったら再生成（preserve しない）", () => {
    expect(shouldPreserveJournalGeneratedComment({ ...base, entryDateUnchanged: false })).toBe(false);
  });

  it("気分・活動・おとものいずれかが変わったら再生成", () => {
    expect(shouldPreserveJournalGeneratedComment({ ...base, moodUnchanged: false })).toBe(false);
    expect(shouldPreserveJournalGeneratedComment({ ...base, activityUnchanged: false })).toBe(false);
    expect(shouldPreserveJournalGeneratedComment({ ...base, companionUnchanged: false })).toBe(false);
  });

  it("本文・写真・文字サイズのみの前提で、上記がすべて同じなら preserve", () => {
    expect(shouldPreserveJournalGeneratedComment(base)).toBe(true);
  });

  it("regenerateOwlComment が true なら常に再生成", () => {
    expect(shouldPreserveJournalGeneratedComment({ ...base, regenerateOwlComment: true })).toBe(false);
  });

  it("既存コメントが空なら preserve しない（初回生成扱い）", () => {
    expect(shouldPreserveJournalGeneratedComment({ ...base, hasExistingComment: false })).toBe(false);
  });
});
