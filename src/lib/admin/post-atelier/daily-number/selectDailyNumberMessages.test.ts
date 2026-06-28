import { describe, expect, it } from "vitest";

import { buildDailyNumberGeneratedPayload } from "./lookup";
import { DAILY_NUMBER_MESSAGES } from "./dailyNumberMessages";
import { extractImageBody } from "./messageTextSplit";
import {
  formatDailyNumberMessageSeasonUsageLabel,
  pickRandomDailyNumberMessageSeason,
  resolveDailyNumberMessageSeason,
} from "./messageSeasonMode";
import { selectDailyNumberMessages } from "./selectDailyNumberMessages";

describe("messageSeasonMode", () => {
  it("resolveDailyNumberMessageSeason は base / summer をそのまま返す", () => {
    expect(
      resolveDailyNumberMessageSeason({
        messageSeasonMode: "base",
        todayNumber: 1,
        variant: "A",
      }),
    ).toBe("base");
    expect(
      resolveDailyNumberMessageSeason({
        messageSeasonMode: "summer",
        todayNumber: 1,
        variant: "A",
      }),
    ).toBe("summer");
  });

  it("random は lockedMessageSeason を優先する", () => {
    expect(
      resolveDailyNumberMessageSeason({
        messageSeasonMode: "random",
        todayNumber: 1,
        variant: "A",
        lockedMessageSeason: "summer",
      }),
    ).toBe("summer");
  });

  it("pickRandomDailyNumberMessageSeason は base か summer を返す", () => {
    const picked = pickRandomDailyNumberMessageSeason(3, "A");
    expect(["base", "summer"]).toContain(picked);
  });
});

describe("selectDailyNumberMessages summer", () => {
  it("summer + variant A では夏版本文を返す", () => {
    const messages = selectDailyNumberMessages(DAILY_NUMBER_MESSAGES, {
      todayNumber: 1,
      character: "owl",
      messageType: "base",
      variant: "A",
      season: "summer",
    });
    expect(messages).toHaveLength(12);
    const lp1 = messages.find((m) => m.lifePathNumber === 1);
    expect(lp1?.body).toContain("夏の朝の光");
    expect(extractImageBody(lp1?.body ?? "")).toContain("夏の朝の光");
  });

  it("summer + variant B では base B に fallback", () => {
    const summerB = selectDailyNumberMessages(DAILY_NUMBER_MESSAGES, {
      todayNumber: 1,
      character: "owl",
      messageType: "base",
      variant: "B",
      season: "summer",
    });
    expect(summerB.find((m) => m.lifePathNumber === 1)?.body).toContain("今日の「1」の空気");
  });
});

describe("buildDailyNumberGeneratedPayload messageSeason", () => {
  it("messageSeasonMode=summer なら夏版1文目を使う（日付は関係ない）", () => {
    const payload = buildDailyNumberGeneratedPayload({
      scheduledDate: "2026-01-15",
      todayNumber: 2,
      character: "owl",
      messageType: "base",
      variantMode: "A",
      messageSeasonMode: "summer",
    });
    expect(payload?.messageSeason).toBe("summer");
    const lp2 = payload?.pages[0]?.blocks.find((b) => b.lifePathNumber === 2);
    expect(extractImageBody(lp2?.body ?? "")).toContain("夏の木陰");
  });

  it("messageSeasonMode=base なら通常文案", () => {
    const payload = buildDailyNumberGeneratedPayload({
      scheduledDate: "2026-07-15",
      todayNumber: 2,
      character: "owl",
      messageType: "base",
      variantMode: "A",
      messageSeasonMode: "base",
    });
    expect(payload?.messageSeason).toBe("base");
    const lp2 = payload?.pages[0]?.blocks.find((b) => b.lifePathNumber === 2);
    expect(extractImageBody(lp2?.body ?? "")).toContain("今日の「2」の空気");
  });

  it("formatDailyNumberMessageSeasonUsageLabel", () => {
    expect(
      formatDailyNumberMessageSeasonUsageLabel({
        messageSeasonMode: "random",
        messageSeason: "summer",
      }),
    ).toContain("夏の森");
  });
});
