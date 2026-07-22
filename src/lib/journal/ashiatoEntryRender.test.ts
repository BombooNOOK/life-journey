import { describe, expect, it } from "vitest";

import {
  ashiatoDailyNumberLabels,
  ashiatoDailyNumberValues,
  ashiatoDailyNumberSlotLeftNudgePct,
  ashiatoPercentRectToPx,
  ashiatoPlanShows,
  formatAshiatoSlashYmdWeekdayDate,
  formatAshiatoVerticalDateColumns,
  formatAshiatoVerticalDateParts,
  formatAshiatoVerticalDateText,
  getAshiatoHorizontalBodyCapacity,
  getAshiatoHorizontalBodyLayoutLines,
  resolveAshiatoEntryRenderPlan,
  splitDailyNumberSlots,
  splitVerticalJapaneseColumns,
} from "@/lib/journal/ashiatoEntryRender";

describe("ashiatoEntryRender", () => {
  it("converts percent rects to px on 721×1024", () => {
    const px = ashiatoPercentRectToPx({ left: 10, top: 20, width: 50, height: 25 });
    expect(px.leftPx).toBeCloseTo(72.1);
    expect(px.topPx).toBeCloseTo(204.8);
    expect(px.widthPx).toBeCloseTo(360.5);
    expect(px.heightPx).toBeCloseTo(256);
  });

  it("hides numbers and reading for mori_enikki", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "mori_enikki" });
    expect(ashiatoPlanShows(plan, "photo")).toBe(true);
    expect(ashiatoPlanShows(plan, "dailyNumber")).toBe(false);
    expect(ashiatoPlanShows(plan, "reading")).toBe(false);
    expect(plan.bodyWritingMode).toBe("vertical");
    expect(plan.photoOverlaySrc).toBeNull();
  });

  it("uses preview composite for layered dev preview", () => {
    const plan = resolveAshiatoEntryRenderPlan({
      pageTemplate: "mori_enikki",
      preferLayeredPreviewComposite: true,
    });
    expect(plan.backgroundSrc).toContain("ashiato_template_mori_enikki_preview.png");
    expect(plan.photoOverlaySrc).toBeNull();
  });

  it("uses companion body art for suuji irodori", () => {
    const plan = resolveAshiatoEntryRenderPlan({
      pageTemplate: "suuji_ashiato_irodori",
      companionType: "hedgehog",
    });
    expect(plan.backgroundSrc).toContain("ashiato_template_suuji_irodori_harinezumi.png");
    expect(ashiatoPlanShows(plan, "dailyNumber")).toBe(true);
    expect(plan.photoOverlaySrc).toBeNull();
    expect(plan.photoRotateDeg).toBe(-5);
    expect(plan.slotsPercent.mood).toBeTruthy();
    expect(plan.slotsPercent.activity).toBeTruthy();
  });

  it("orders standard daily numbers as year・month・day", () => {
    expect(
      ashiatoDailyNumberValues("suuji_ashiato_standard", { today: 5, month: 3, year: 8 }),
    ).toEqual(["8", "3", "5"]);
    expect(ashiatoDailyNumberLabels("suuji_ashiato_standard")).toEqual([
      "Year",
      "Month",
      "Day",
    ]);
    expect(
      ashiatoDailyNumberValues("suuji_ashiato_irodori", { today: 5, month: 3, year: 8 }),
    ).toEqual(["5", "3", "8"]);
  });

  it("formats vertical date with weekday as 金曜日 column", () => {
    const parts = formatAshiatoVerticalDateParts(new Date(2026, 5, 5));
    expect(parts.some((p) => p.kind === "weekday" && p.text === "金曜日")).toBe(true);
    const columns = formatAshiatoVerticalDateColumns(new Date(2026, 5, 5));
    expect(columns.dateText).toContain("２０２６年６月５日");
    expect(columns.weekdayText).toBe("金曜日");
    expect(formatAshiatoVerticalDateText(new Date(2026, 5, 5))).toContain("金曜日");
  });

  it("formats yohaku slash date without drawing slashes", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "mori_yohaku_note" });
    expect(plan.dateLayout).toBe("slash_ymd_weekday");
    expect(plan.dateParts?.year).toBeTruthy();
    const slash = formatAshiatoSlashYmdWeekdayDate(new Date(2026, 5, 5));
    expect(slash).toEqual({
      year: "2026",
      month: "6",
      day: "5",
      weekday: "金曜日",
    });
  });

  it("wraps yohaku body with per-line start positions and tracks max chars", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "mori_yohaku_note" });
    expect(plan.bodyTextLayout?.lineStartChar).toMatchObject({
      4: 3,
      5: 3,
      6: 5,
      7: 5,
      8: 7,
      9: 8,
    });
    const body = plan.slotsPercent.body!;
    const capacity = getAshiatoHorizontalBodyCapacity("standard", body, plan.bodyTextLayout);
    expect(capacity.maxLines).toBeGreaterThanOrEqual(9);
    expect(capacity.maxCharsByLine[0]).toBe(capacity.baseMaxCharsPerLine);
    expect(capacity.maxCharsByLine[3]).toBe(capacity.baseMaxCharsPerLine - 2); // 3文字目
    expect(capacity.maxCharsByLine[4]).toBe(capacity.baseMaxCharsPerLine - 2); // 3文字目
    expect(capacity.maxCharsByLine[5]).toBe(capacity.baseMaxCharsPerLine - 4); // 5文字目
    expect(capacity.maxCharsByLine[7]).toBe(capacity.baseMaxCharsPerLine - 6); // 7文字目
    expect(capacity.maxCharsByLine[8]).toBe(capacity.baseMaxCharsPerLine - 7); // 8文字目
    expect(capacity.maxBindingChars).toBe(
      capacity.maxCharsByLine.reduce((sum, n) => sum + n, 0),
    );

    const long = "あ".repeat(capacity.maxBindingChars + 40);
    const lines = getAshiatoHorizontalBodyLayoutLines(long, "standard", body, plan.bodyTextLayout);
    expect(lines[3]!.length).toBeLessThanOrEqual(capacity.maxCharsByLine[3]!);
    expect(lines[8]!.length).toBeLessThanOrEqual(capacity.maxCharsByLine[8]!);
  });

  it("skips photo overlay for simple mori_enikki", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "mori_enikki" });
    expect(plan.photoOverlaySrc).toBeNull();
    expect(plan.backgroundSrc).toContain("ashiato_template_mori_enikki_background.png");
  });

  it("splits daily number into three slots", () => {
    const slots = splitDailyNumberSlots({ left: 0, top: 10, width: 90, height: 8 });
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ left: 0, top: 10, width: 30, height: 8 });
    expect(slots[2].left).toBeCloseTo(60);
  });

  it("nudges irodori month and year slots to the right", () => {
    const nudge = ashiatoDailyNumberSlotLeftNudgePct("suuji_ashiato_irodori");
    expect(nudge).toEqual([0, 1.2, 2.2]);
    const slots = splitDailyNumberSlots(
      { left: 60, top: 10, width: 30, height: 8 },
      { leftNudgePctByIndex: nudge },
    );
    expect(slots[0]!.left).toBeCloseTo(60);
    expect(slots[1]!.left).toBeCloseTo(70 + 1.2);
    expect(slots[2]!.left).toBeCloseTo(80 + 2.2);
  });

  it("splits vertical columns", () => {
    const cols = splitVerticalJapaneseColumns("あいうえおかきくけこ", 5, 3);
    expect(cols).toEqual(["あいうえお", "かきくけこ"]);
  });
});
