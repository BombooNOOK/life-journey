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

  it("句点がなければ全文を上限まで", () => {
    const long = "あ".repeat(60);
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

  it("長い1文は省略する", () => {
    const long = "あ".repeat(60);
    expect(extractSocialPostCommentText(long)).toBe(`${"あ".repeat(44)}…`);
  });
});
