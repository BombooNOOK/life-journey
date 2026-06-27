import { describe, expect, it } from "vitest";

import {
  extractSocialPostBodyText,
  extractSocialPostCommentText,
} from "./textExtract";

describe("extractSocialPostBodyText", () => {
  it("最初の句点までを返す", () => {
    expect(
      extractSocialPostBodyText("朝から雨。午後は晴れた。とても良い一日。"),
    ).toBe("朝から雨。");
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
