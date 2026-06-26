import { describe, expect, it } from "vitest";

import {
  getTodayNumberColorName,
  hasTodayNumberBaseCover,
  selectTodayNumberCover,
} from "./selectTodayNumberCover";
import type { TodayNumberCoverVariantRecord } from "./types";

const sample: TodayNumberCoverVariantRecord[] = [
  {
    todayNumber: 8,
    season: "base",
    variant: "A",
    title: "base A",
    summaryMessage: "summary A",
    colorName: "オレンジ・茶色",
    themeKeywords: [],
    toneNotes: [],
    avoidNotes: [],
  },
  {
    todayNumber: 8,
    season: "base",
    variant: "B",
    title: "base B",
    summaryMessage: "summary B",
    colorName: "オレンジ・茶色",
    themeKeywords: [],
    toneNotes: [],
    avoidNotes: [],
  },
  {
    todayNumber: 8,
    season: "spring",
    variant: "A",
    title: "spring A",
    summaryMessage: "spring summary",
    colorName: "ピンク",
    themeKeywords: [],
    toneNotes: [],
    avoidNotes: [],
  },
  {
    todayNumber: 8,
    season: "base",
    specialSeason: "new_year",
    variant: "A",
    title: "new year A",
    summaryMessage: "ny summary",
    colorName: "白",
    themeKeywords: [],
    toneNotes: [],
    avoidNotes: [],
  },
];

describe("selectTodayNumberCover", () => {
  it("未指定時は base variant A を返す", () => {
    expect(selectTodayNumberCover(sample, { todayNumber: 8 })?.title).toBe("base A");
  });

  it("variant B を指定できる", () => {
    expect(selectTodayNumberCover(sample, { todayNumber: 8, variant: "B" })?.title).toBe(
      "base B",
    );
  });

  it("specialSeason が最優先", () => {
    expect(
      selectTodayNumberCover(sample, {
        todayNumber: 8,
        specialSeason: "new_year",
        season: "spring",
      })?.title,
    ).toBe("new year A");
  });

  it("specialSeason が無ければ season に fallback", () => {
    expect(
      selectTodayNumberCover(sample, { todayNumber: 8, season: "spring" })?.title,
    ).toBe("spring A");
  });

  it("該当なしは base に fallback", () => {
    expect(
      selectTodayNumberCover(sample, { todayNumber: 8, season: "winter" })?.title,
    ).toBe("base A");
  });

  it("本文が空の行は候補にしない", () => {
    const sparse: TodayNumberCoverVariantRecord[] = [
      {
        todayNumber: 1,
        season: "base",
        variant: "A",
        title: "",
        summaryMessage: "",
        colorName: "",
        themeKeywords: [],
        toneNotes: [],
        avoidNotes: [],
      },
    ];
    expect(selectTodayNumberCover(sparse, { todayNumber: 1 })).toBeNull();
  });
});

describe("getTodayNumberColorName", () => {
  it("base variant A の colorName を返す", () => {
    expect(getTodayNumberColorName(sample, 8)).toBe("オレンジ・茶色");
  });
});

describe("hasTodayNumberBaseCover", () => {
  it("base A があれば true", () => {
    expect(hasTodayNumberBaseCover(sample, 8)).toBe(true);
    expect(hasTodayNumberBaseCover(sample, 1)).toBe(false);
  });
});
