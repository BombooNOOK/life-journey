import { describe, expect, it } from "vitest";

import {
  DIARY_READING_COMMENT_BLOCK_SEPARATOR,
  joinDiaryReadingCommentParts,
} from "./commentTextRules";

describe("joinDiaryReadingCommentParts", () => {
  it("joins base and accent with a single block separator", () => {
    const text = joinDiaryReadingCommentParts(
      "前半です。続きもあります。",
      "後半です。終わり。",
    );
    expect(text).toBe(
      `前半です。続きもあります。${DIARY_READING_COMMENT_BLOCK_SEPARATOR}後半です。終わり。`,
    );
    expect((text.match(/\n/g) ?? []).length).toBe(1);
  });

  it("returns base only when accent is missing", () => {
    expect(joinDiaryReadingCommentParts("前半だけ。")).toBe("前半だけ。");
    expect(joinDiaryReadingCommentParts("前半だけ。", null, "")).toBe("前半だけ。");
  });
});
