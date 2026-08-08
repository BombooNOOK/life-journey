import { describe, expect, it } from "vitest";

import {
  BAMBOO_NOOK_FOREST_HASHTAG,
  buildMoriLogShareCaption,
  buildMoriLogShareHashtags,
} from "@/lib/journal/moriLog/moriLogShareCaption";

describe("buildMoriLogShareHashtags", () => {
  it("converts tags and appends the forest brand once", () => {
    expect(buildMoriLogShareHashtags(["旅行", "家族", "夏"])).toEqual([
      "#旅行",
      "#家族",
      "#夏",
      BAMBOO_NOOK_FOREST_HASHTAG,
    ]);
  });

  it("dedupes case-insensitively and strips leading #", () => {
    expect(buildMoriLogShareHashtags(["#旅行", "旅行", "家族"])).toEqual([
      "#旅行",
      "#家族",
      BAMBOO_NOOK_FOREST_HASHTAG,
    ]);
  });

  it("does not duplicate the forest brand if already in tags", () => {
    expect(
      buildMoriLogShareHashtags(["BambooNOOKの森", "#BambooNOOKの森", "旅"]),
    ).toEqual(["#旅", BAMBOO_NOOK_FOREST_HASHTAG]);
  });

  it("works with empty tags", () => {
    expect(buildMoriLogShareHashtags([])).toEqual([BAMBOO_NOOK_FOREST_HASHTAG]);
    expect(buildMoriLogShareHashtags(null)).toEqual([BAMBOO_NOOK_FOREST_HASHTAG]);
  });
});

describe("buildMoriLogShareCaption", () => {
  it("builds diary caption from full body + media tags", () => {
    const result = buildMoriLogShareCaption({
      body: "今日はモグと森をあるいた。\nとても楽しかった。",
      title: "カードタイトル",
      tags: ["モグ", "おでかけ"],
      sourceOrigin: "diary",
    });
    expect(result.text).toBe(
      ["今日はモグと森をあるいた。", "とても楽しかった。", "", "#モグ #おでかけ #BambooNOOKの森"].join(
        "\n",
      ),
    );
    expect(result.hashtags).toEqual(["#モグ", "#おでかけ", BAMBOO_NOOK_FOREST_HASHTAG]);
  });

  it("falls back to title when body is missing (device movie / fetch fail)", () => {
    const result = buildMoriLogShareCaption({
      body: null,
      title: "もぐもぐモグ",
      tags: [],
      sourceOrigin: "device_video",
    });
    expect(result.text).toBe(`もぐもぐモグ\n\n${BAMBOO_NOOK_FOREST_HASHTAG}`);
  });

  it("uses only hashtags when both body and title are empty", () => {
    const result = buildMoriLogShareCaption({
      body: "   ",
      title: "",
      tags: ["夏"],
    });
    expect(result.text).toBe(`#夏 ${BAMBOO_NOOK_FOREST_HASHTAG}`);
  });
});
