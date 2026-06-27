import { describe, expect, it } from "vitest";

import {
  buildBlockCaptionText,
  buildBlockImageText,
  extractImageBody,
} from "./messageTextSplit";
import type { DailyNumberMessage } from "./types";

const sampleBlock: DailyNumberMessage = {
  todayNumber: 2,
  lifePathNumber: 1,
  character: "owl",
  messageType: "base",
  displayName: "すうじ1のあなたへ",
  subtitle: "始まりのすうじ",
  body: "今日の「2」の空気は、あなたのはじまりに誰かのぬくもりを添えてくれそうです。まずは小さく、ひとつ始めてみてください。",
  colorName: "赤",
  actions: ["a", "b"],
};

describe("extractImageBody", () => {
  it("最初の句点までを返す", () => {
    expect(extractImageBody(sampleBlock.body)).toBe(
      "今日の「2」の空気は、あなたのはじまりに誰かのぬくもりを添えてくれそうです。",
    );
  });

  it("句点が無い場合は全文", () => {
    expect(extractImageBody("ひとつ始めてみてください")).toBe("ひとつ始めてみてください");
  });

  it("空白のみは空文字", () => {
    expect(extractImageBody("   ")).toBe("");
  });
});

describe("buildBlockImageText / buildBlockCaptionText", () => {
  it("画像用とキャプション用を同じ元データから分ける", () => {
    const image = buildBlockImageText(sampleBlock, 2);
    const caption = buildBlockCaptionText(sampleBlock, 2);

    expect(image).toEqual({
      number: 1,
      todayNumber: 2,
      imageBody:
        "今日の「2」の空気は、あなたのはじまりに誰かのぬくもりを添えてくれそうです。",
      charmColor: "赤",
    });
    expect(caption).toEqual({
      number: 1,
      todayNumber: 2,
      fullBody: sampleBlock.body,
    });
  });
});
