import { describe, expect, it } from "vitest";

import { buildInstagramCaption } from "./buildCopyText";
import {
  CAPTION_ABOUT_KOKORO_YOHO,
  CAPTION_APP_INVITE,
  CAPTION_DIARY_INVITE,
  CAPTION_HASHTAGS,
  CAPTION_HOW_TO_READ,
  CAPTION_SECTION_DIVIDER,
  CAPTION_TITLE_LINES,
} from "./instagramCaptionCopy";
import { resolveDailyNumberPost } from "./resolveDailyNumberPost";

function ud8OwlPayload() {
  const resolved = resolveDailyNumberPost({
    scheduledDate: "2026-06-19",
    todayNumber: 8,
    character: "owl",
    messageType: "base",
  });
  if (!resolved.ok) throw new Error("expected ok");
  return resolved.payload;
}

describe("buildInstagramCaption", () => {
  it("LJD らしい導入・説明・誘導を含む", () => {
    const caption = buildInstagramCaption(ud8OwlPayload());

    expect(caption.startsWith(CAPTION_TITLE_LINES.join("\n"))).toBe(true);
    expect(caption).toContain(CAPTION_ABOUT_KOKORO_YOHO);
    expect(caption).toContain(CAPTION_HOW_TO_READ);
    expect(caption).toContain(CAPTION_DIARY_INVITE);
    expect(caption).toContain(CAPTION_APP_INVITE);
    expect(caption).toContain("森のどうぶつ鑑定士たちが");
    expect(caption).toContain("力を整えて、形にする日");
  });

  it("個別メッセージは本文とおすすめのすごしかたを含む", () => {
    const payload = ud8OwlPayload();
    const caption = buildInstagramCaption(payload);
    const firstBlock = payload.pages[0]?.blocks[0];
    if (!firstBlock) throw new Error("expected block");

    expect(caption).toContain("【すうじ1のあなたへ】");
    expect(caption).toContain(firstBlock.body);
    expect(caption).toContain("おすすめのすごしかた");
    expect(caption).toContain(`・${firstBlock.actions[0]}`);
    expect(caption).toContain(`・${firstBlock.actions[1]}`);
  });

  it("キャプションではおまもりカラー・すうじ名サブタイトルは省略", () => {
    const payload = ud8OwlPayload();
    const caption = buildInstagramCaption(payload);

    expect(caption).not.toContain("おまもりカラー");
    expect(caption).not.toContain("始まりのすうじ");
    expect(caption).not.toMatch(/^今日のすうじ：/m);
  });

  it("ハッシュタグは5個前後", () => {
    const caption = buildInstagramCaption(ud8OwlPayload());
    const tags = caption.match(/#[^\s#]+/g) ?? [];
    expect(tags).toEqual([...CAPTION_HASHTAGS]);
    expect(tags).toHaveLength(5);
  });

  it("最後の個別メッセージと LJD 紹介の間に区切り線がある", () => {
    const caption = buildInstagramCaption(ud8OwlPayload());
    expect(caption).toContain(CAPTION_SECTION_DIVIDER);
    const dividerIndex = caption.indexOf(CAPTION_SECTION_DIVIDER);
    const diaryIndex = caption.indexOf(CAPTION_DIARY_INVITE);
    expect(dividerIndex).toBeGreaterThan(-1);
    expect(diaryIndex).toBeGreaterThan(dividerIndex);
    expect(caption.slice(dividerIndex, diaryIndex)).toContain(CAPTION_SECTION_DIVIDER);
  });
});
