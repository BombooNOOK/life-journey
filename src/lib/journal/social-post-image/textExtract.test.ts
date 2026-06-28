import { describe, expect, it } from "vitest";

import {
  DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE,
  extractSocialPostBodyText,
  extractSocialPostCommentText,
  resolveJournalSocialPostSubtitle,
  clampJournalSocialPostTitle,
} from "./textExtract";

describe("extractSocialPostBodyText", () => {
  it("sns02 は最初の句点までを返す", () => {
    expect(
      extractSocialPostBodyText("朝から雨。午後は晴れた。とても良い一日。", "sns02"),
    ).toBe("朝から雨。");
  });

  it("sns03 は句点区切りで上限まで連結する", () => {
    expect(
      extractSocialPostBodyText("朝から雨。午後は晴れた。とても良い一日。", "sns03"),
    ).toBe("朝から雨。午後は晴れた。とても良い一日。");
  });

  it("sns03 は93文字を超える分は … で締める", () => {
    const text =
      "今日はモグの病院最終日で、午前中はすこし緊張していた。診察が終わってホッとしたあと、公園で雪を見て喜んでいた。帰り道はバスで眠そうにしながら、窓の外を見ていた。夕食前には元気を取り戻して、ひとりで薬を飲めた。";
    const excerpt = extractSocialPostBodyText(text, "sns03");
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(93);
    expect(excerpt).toContain("今日はモグの病院最終日");
  });

  it("！？でも切れる", () => {
    expect(extractSocialPostBodyText("びっくり！？ そのあと続く。")).toBe("びっくり！？");
  });

  it("？や！でも切れる", () => {
    expect(extractSocialPostBodyText("本当に？ うれしい！ また明日。")).toBe("本当に？");
  });

  it("句点がなければ上限まで … で締める", () => {
    const long = "あ".repeat(60);
    expect(extractSocialPostBodyText(long)).toBe(`${"あ".repeat(49)}…`);
  });

  it("1文が上限より長いとき … で締める", () => {
    const long = `${"あ".repeat(55)}。`;
    expect(extractSocialPostBodyText(long)).toBe(`${"あ".repeat(49)}…`);
  });

  it("改行はスペースに正規化", () => {
    expect(extractSocialPostBodyText("今日は\nおだやか。\nまた明日。")).toBe("今日は おだやか。");
  });
});

describe("extractSocialPostCommentText", () => {
  it("最初の句点までを返す", () => {
    expect(
      extractSocialPostCommentText("静かな一日でした。\n心が落ち着きます。"),
    ).toBe("静かな一日でした。");
  });

  it("！でも切れる", () => {
    expect(extractSocialPostCommentText("がんばった！ よくできました。")).toBe("がんばった！");
  });

  it("長い1文は … で省略する", () => {
    const long = "あ".repeat(60);
    expect(extractSocialPostCommentText(long)).toBe(`${"あ".repeat(44)}…`);
  });
});

describe("clampJournalSocialPostTitle", () => {
  it("sns03 は10文字まで", () => {
    expect(clampJournalSocialPostTitle("イスの下からこんにちは", "sns03")).toBe("イスの下からこんにち");
    expect(clampJournalSocialPostTitle("  短い  ", "sns03")).toBe("短い");
  });

  it("sns02 は14文字まで", () => {
    expect(clampJournalSocialPostTitle("あ".repeat(20), "sns02")).toBe("あ".repeat(14));
  });
});

describe("resolveJournalSocialPostSubtitle", () => {
  it("空欄のとき既定文を返す", () => {
    expect(resolveJournalSocialPostSubtitle("")).toBe(DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE);
    expect(resolveJournalSocialPostSubtitle("   ")).toBe(DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE);
  });

  it("入力があればそのまま使う", () => {
    expect(resolveJournalSocialPostSubtitle("  今日の一コマ  ")).toBe("今日の一コマ");
  });
});
