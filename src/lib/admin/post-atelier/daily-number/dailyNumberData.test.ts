import { describe, expect, it } from "vitest";

import { DAILY_NUMBER_MESSAGES, TODAY_NUMBER_COVER_VARIANTS } from "./dailyNumberMessages";
import { readCsvRecords } from "./csvIO";
import { assertDailyNumberMessageLayoutsValid } from "./layoutTextValidation";
import { hasTodayNumberBaseCover } from "./selectTodayNumberCover";

describe("daily number CSV data", () => {
  it("messages CSV は 324 行ある（UD×LP×variant A/B/C）", () => {
    const records = readCsvRecords("daily-number-messages-owl-base.csv");
    expect(records).toHaveLength(324);
  });

  it("variant A は UD1〜9 それぞれ 12 件入っている", () => {
    for (let ud = 1; ud <= 9; ud += 1) {
      expect(
        DAILY_NUMBER_MESSAGES.filter(
          (m) => m.todayNumber === ud && m.character === "owl" && m.variant === "A",
        ),
      ).toHaveLength(12);
    }
  });

  it("UD8 × owl × base variant A は cover と messages が揃う", () => {
    expect(hasTodayNumberBaseCover(TODAY_NUMBER_COVER_VARIANTS, 8)).toBe(true);
    expect(
      DAILY_NUMBER_MESSAGES.filter(
        (m) => m.todayNumber === 8 && m.character === "owl" && m.variant === "A",
      ),
    ).toHaveLength(12);
  });

  it("cover CSV は base A/B/C × UD1〜9 の 27 スロットがある", () => {
    const records = readCsvRecords("daily-number-today-cover-owl.csv");
    expect(records).toHaveLength(27);
    const baseA = records.filter((r) => r.season === "base" && !r.specialSeason && r.variant === "A");
    expect(baseA).toHaveLength(9);
  });

  it("messages CSV の UD8 LP1 variant A は本文を壊さない", () => {
    const records = readCsvRecords("daily-number-messages-owl-base.csv");
    const row = records.find(
      (r) => r.todayNumber === "8" && r.lifePathNumber === "1" && r.variant === "A",
    );
    expect(row?.body).toContain("始める力");
  });

  it("入稿済み messages は画像レイアウトの文字数チェックを通過する", () => {
    const records = readCsvRecords("daily-number-messages-owl-base.csv");
    const filled = records.filter((r) => r.body?.trim() && r.action1?.trim() && r.action2?.trim());
    expect(filled.length).toBeGreaterThan(0);
    assertDailyNumberMessageLayoutsValid(
      filled.map((r) => ({
        todayNumber: Number(r.todayNumber),
        lifePathNumber: Number(r.lifePathNumber),
        variant: r.variant ?? "A",
        body: r.body ?? "",
        action1: r.action1 ?? "",
        action2: r.action2 ?? "",
      })),
    );
  });
});
