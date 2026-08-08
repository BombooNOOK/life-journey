import { describe, expect, it } from "vitest";

import {
  BAMBOO_NOOK_FOREST_HASHTAG,
  LIFE_JOURNEY_DIARY_HASHTAG,
  buildMoriLogShareCaption,
  buildMoriLogShareHashtags,
} from "@/lib/journal/moriLog/moriLogShareCaption";

const FIXED = [BAMBOO_NOOK_FOREST_HASHTAG, LIFE_JOURNEY_DIARY_HASHTAG] as const;
const FIXED_LINE = `${BAMBOO_NOOK_FOREST_HASHTAG} ${LIFE_JOURNEY_DIARY_HASHTAG}`;

describe("buildMoriLogShareHashtags", () => {
  it("converts tags and appends fixed brands once", () => {
    expect(buildMoriLogShareHashtags(["旅行", "家族", "夏"])).toEqual([
      "#旅行",
      "#家族",
      "#夏",
      ...FIXED,
    ]);
  });

  it("dedupes case-insensitively and strips leading #", () => {
    expect(buildMoriLogShareHashtags(["#旅行", "旅行", "家族"])).toEqual([
      "#旅行",
      "#家族",
      ...FIXED,
    ]);
  });

  it("does not duplicate fixed brands if already in tags", () => {
    expect(
      buildMoriLogShareHashtags([
        "BambooNOOKの森",
        "#BambooNOOKの森",
        "LifeJourneyDiary",
        "旅",
      ]),
    ).toEqual(["#旅", ...FIXED]);
  });

  it("works with empty tags", () => {
    expect(buildMoriLogShareHashtags([])).toEqual([...FIXED]);
    expect(buildMoriLogShareHashtags(null)).toEqual([...FIXED]);
  });
});

describe("buildMoriLogShareCaption", () => {
  it("builds diary caption with user tags and fixed brands on separate lines", () => {
    const result = buildMoriLogShareCaption({
      body: "今日はモグと森をあるいた。\nとても楽しかった。",
      title: "カードタイトル",
      tags: ["モグ", "おでかけ"],
      sourceOrigin: "diary",
    });
    expect(result.text).toBe(
      [
        "今日はモグと森をあるいた。",
        "とても楽しかった。",
        "",
        "#モグ #おでかけ",
        FIXED_LINE,
      ].join("\n"),
    );
    expect(result.hashtags).toEqual(["#モグ", "#おでかけ", ...FIXED]);
  });

  it("matches the product example layout", () => {
    const result = buildMoriLogShareCaption({
      body: "あしあと本文",
      tags: ["旅行", "家族", "夏の思い出"],
    });
    expect(result.text).toBe(
      ["あしあと本文", "", "#旅行 #家族 #夏の思い出", FIXED_LINE].join("\n"),
    );
  });

  it("falls back to title when body is missing (device movie / fetch fail)", () => {
    const result = buildMoriLogShareCaption({
      body: null,
      title: "もぐもぐモグ",
      tags: [],
      sourceOrigin: "device_video",
    });
    expect(result.text).toBe(`もぐもぐモグ\n\n${FIXED_LINE}`);
  });

  it("uses only hashtag lines when both body and title are empty", () => {
    const result = buildMoriLogShareCaption({
      body: "   ",
      title: "",
      tags: ["夏"],
    });
    expect(result.text).toBe(`#夏\n${FIXED_LINE}`);
  });
});
