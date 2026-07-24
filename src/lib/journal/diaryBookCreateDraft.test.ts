import { describe, expect, it } from "vitest";

import {
  DIARY_BOOK_CREATE_RESUME_PATH,
  isDiaryBookCreateResumePath,
} from "./diaryBookCreateDraft";
import { resolveJournalReturnNavLabel } from "./bookshelfReturnTo";

describe("isDiaryBookCreateResumePath", () => {
  it("detects create resume URL", () => {
    expect(isDiaryBookCreateResumePath(DIARY_BOOK_CREATE_RESUME_PATH)).toBe(true);
    expect(isDiaryBookCreateResumePath("/orders/bookshelf")).toBe(false);
  });
});

describe("resolveJournalReturnNavLabel", () => {
  it("labels list and create resume", () => {
    expect(resolveJournalReturnNavLabel("/orders/list?month=2026-07")).toBe(
      "あしあと帳へ戻る",
    );
    expect(resolveJournalReturnNavLabel(DIARY_BOOK_CREATE_RESUME_PATH)).toBe(
      "本に入れるあしあと選択へ戻る",
    );
    expect(
      resolveJournalReturnNavLabel(
        "/orders/bookshelf/diary-book/clxyz1234567890/edit-includes",
      ),
    ).toBe("本に入れるあしあと選択へ戻る");
  });
});
