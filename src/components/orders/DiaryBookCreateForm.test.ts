import { describe, expect, it } from "vitest";

import { diaryBookCreateDisabledReason } from "./DiaryBookCreateForm";

const base = {
  title: "テスト本",
  startDate: "2026-01-01",
  endDate: "2026-06-01",
  periodChecked: true,
  canCreate: true,
  creating: false,
};

describe("diaryBookCreateDisabledReason", () => {
  it("returns null when all requirements are met", () => {
    expect(diaryBookCreateDisabledReason(base)).toBeNull();
  });

  it("follows priority: creating before title", () => {
    expect(
      diaryBookCreateDisabledReason({ ...base, creating: true, title: "" }),
    ).toBe("作成中です");
  });

  it("requires title before dates", () => {
    expect(
      diaryBookCreateDisabledReason({ ...base, title: "  ", startDate: "" }),
    ).toBe("あしあとブック名を入力してください");
  });

  it("requires dates before preview", () => {
    expect(
      diaryBookCreateDisabledReason({ ...base, startDate: "", periodChecked: false }),
    ).toBe("開始日と終了日を設定してください");
  });

  it("requires preview before included entries", () => {
    expect(
      diaryBookCreateDisabledReason({ ...base, periodChecked: false, canCreate: false }),
    ).toBe("掲載するあしあとを確認してください");
  });

  it("reports no included entries last", () => {
    expect(diaryBookCreateDisabledReason({ ...base, canCreate: false })).toBe(
      "本に入れるあしあとがありません",
    );
  });
});
