import { describe, expect, it } from "vitest";

import {
  ashiatoDailyNumberLabels,
  ashiatoDailyNumberValues,
  ashiatoDailyNumberSlotLeftNudgePct,
  ashiatoEntryBodyLengthFlag,
  ashiatoPercentRectToPx,
  ashiatoPlanShows,
  formatAshiatoSlashYmdWeekdayDate,
  formatAshiatoVerticalDateColumns,
  formatAshiatoVerticalDateParts,
  formatAshiatoVerticalDateText,
  getAshiatoHorizontalBodyCapacity,
  getAshiatoHorizontalBodyLayoutLines,
  getAshiatoVerticalBodyColumns,
  ashiatoVerticalDisplayChar,
  isAshiatoVerticalPunctuation,
  normalizeAshiatoBodyContent,
  resolveAshiatoEnikkiVerticalMetrics,
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
      10: 9,
      11: 10,
    });
    expect(plan.bodyTextLayout?.lineStartCharByMode?.relaxed).toMatchObject({
      3: 2,
      5: 4,
      7: 7,
    });
    expect(plan.bodyTextLayout?.lineStartCharByMode?.compact).toMatchObject({
      12: 11,
    });
    expect(plan.bodyTextLayout?.lineShortenCharsByMode?.relaxed).toMatchObject({
      7: 3,
    });
    expect(plan.bodyTextLayout?.lineShortenCharsByMode?.standard).toMatchObject({
      9: 2,
    });
    expect(plan.bodyTextLayout?.lineShortenCharsByMode?.generous).toMatchObject({
      10: 2,
      11: 4,
    });
    expect(plan.bodyTextLayout?.lineShortenCharsByMode?.compact).toMatchObject({
      11: 2,
      12: 4,
    });
    expect(plan.bodyTextLayout?.maxLinesByMode?.compact).toBe(12);
    const body = plan.slotsPercent.body!;
    const capacity = getAshiatoHorizontalBodyCapacity("standard", body, plan.bodyTextLayout);
    expect(capacity.maxLines).toBe(9);
    expect(capacity.maxCharsByLine).toHaveLength(9);
    expect(capacity.maxCharsByLine[0]).toBe(capacity.baseMaxCharsPerLine);
    expect(capacity.maxCharsByLine[3]).toBe(capacity.baseMaxCharsPerLine - 2); // 3文字目
    expect(capacity.maxCharsByLine[4]).toBe(capacity.baseMaxCharsPerLine - 2); // 3文字目
    expect(capacity.maxCharsByLine[5]).toBe(capacity.baseMaxCharsPerLine - 4); // 5文字目
    expect(capacity.maxCharsByLine[7]).toBe(capacity.baseMaxCharsPerLine - 6); // 7文字目
    // 最終行(9): 8文字目開始 + 後ろから3（shorten 2）
    expect(capacity.maxCharsByLine[8]).toBe(capacity.baseMaxCharsPerLine - 7 - 2);
    expect(capacity.maxBindingChars).toBe(
      capacity.maxCharsByLine.reduce((sum, n) => sum + n, 0),
    );

    const long = "あ".repeat(capacity.maxBindingChars + 40);
    const lines = getAshiatoHorizontalBodyLayoutLines(long, "standard", body, plan.bodyTextLayout);
    expect(lines[3]!.length).toBeLessThanOrEqual(capacity.maxCharsByLine[3]!);
    expect(lines[7]!.length).toBeLessThanOrEqual(capacity.maxCharsByLine[7]!);
    expect(lines[8]!.length).toBeLessThanOrEqual(capacity.maxCharsByLine[8]!);

    const relaxedCap = getAshiatoHorizontalBodyCapacity("relaxed", body, plan.bodyTextLayout);
    expect(relaxedCap.maxCharsByLine[2]).toBe(relaxedCap.baseMaxCharsPerLine - 1); // 2文字目
    expect(relaxedCap.maxCharsByLine[4]).toBe(relaxedCap.baseMaxCharsPerLine - 3); // 4文字目
    // 7行目: 7文字目開始 + 末尾3字短縮
    expect(relaxedCap.maxCharsByLine[6]).toBe(relaxedCap.baseMaxCharsPerLine - 6 - 3);

    const generousCap = getAshiatoHorizontalBodyCapacity("generous", body, plan.bodyTextLayout);
    expect(generousCap.maxLines).toBe(11);
    // 下から2行目(10): 9文字目開始 + 後ろから3（shorten 2）
    expect(generousCap.maxCharsByLine[9]).toBe(generousCap.baseMaxCharsPerLine - 8 - 2);
    // 最終行(11): 10文字目開始 + 後ろから5（shorten 4）
    expect(generousCap.maxCharsByLine[10]).toBe(generousCap.baseMaxCharsPerLine - 9 - 4);

    const compactCap = getAshiatoHorizontalBodyCapacity("compact", body, plan.bodyTextLayout);
    expect(compactCap.maxLines).toBe(12);
    // 11行目: 10文字目開始 + 後ろから3（shorten 2）
    expect(compactCap.maxCharsByLine[10]).toBe(compactCap.baseMaxCharsPerLine - 9 - 2);
    // 最終行(12): 11文字目開始 + 後ろから5（shorten 4）
    expect(compactCap.maxCharsByLine[11]).toBe(compactCap.baseMaxCharsPerLine - 10 - 4);
  });

  it("shows 5 relaxed lines and 6 standard lines on suuji_ashiato_standard", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "suuji_ashiato_standard" });
    const body = plan.slotsPercent.body!;
    expect(getAshiatoHorizontalBodyCapacity("relaxed", body, null).maxLines).toBeGreaterThanOrEqual(
      5,
    );
    expect(
      getAshiatoHorizontalBodyCapacity("standard", body, null).maxLines,
    ).toBeGreaterThanOrEqual(6);
  });

  it("keeps vertical column pitch for generous/compact aligned to standard rules", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "mori_enikki" });
    const body = plan.slotsPercent.body!;
    const relaxed = resolveAshiatoEnikkiVerticalMetrics("relaxed", body);
    const compact = resolveAshiatoEnikkiVerticalMetrics("compact", body);
    // 列ピッチは全モード共通（標準20×2.18）
    expect(relaxed.columnWidthPx).toBe(20 * 2.18);
    expect(compact.columnWidthPx).toBe(relaxed.columnWidthPx);
    // 字送りはフォントサイズ（ゆったりが20pxマスに潰れない）
    expect(relaxed.charCellPx).toBe(24);
    expect(compact.charCellPx).toBe(15);
    expect(relaxed.maxColumns).toBe(10);
  });

  it("caps enikki at 10 columns and applies column 9/10 edge rules by mode", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "mori_enikki" });
    expect(plan.verticalBodyTextLayout).toMatchObject({
      columnShortenChars: { 9: 1, 10: 6 },
      columnStartChar: { 10: 2 },
      columnShortenCharsByMode: {
        generous: { 9: 2, 10: 7 },
        compact: { 9: 2, 10: 8 },
      },
    });
    const body = plan.slotsPercent.body!;
    for (const mode of ["relaxed", "standard", "generous", "compact"] as const) {
      const metrics = resolveAshiatoEnikkiVerticalMetrics(mode, body);
      expect(metrics.maxColumns).toBe(10);
    }

    const standard = getAshiatoVerticalBodyColumns(
      "あ".repeat(500),
      20,
      10,
      plan.verticalBodyTextLayout,
      "standard",
    );
    expect(standard).toHaveLength(10);
    expect(standard[8]!.replace(/　/g, "").length).toBe(19); // 9列: 20-1（下から2）
    expect(standard[9]!.startsWith("　")).toBe(true); // 10列: 2文字目から
    expect(standard[9]!.replace(/　/g, "").length).toBe(13); // 20-1-6（下から7）

    const generous = getAshiatoVerticalBodyColumns(
      "あ".repeat(500),
      20,
      10,
      plan.verticalBodyTextLayout,
      "generous",
    );
    expect(generous[8]!.replace(/　/g, "").length).toBe(18); // 9列: 20-2（下から3）
    expect(generous[9]!.replace(/　/g, "").length).toBe(12); // 20-1-7（下から8）

    const compact = getAshiatoVerticalBodyColumns(
      "あ".repeat(500),
      20,
      10,
      plan.verticalBodyTextLayout,
      "compact",
    );
    expect(compact[8]!.replace(/　/g, "").length).toBe(18); // 9列: 下から3
    expect(compact[9]!.replace(/　/g, "").length).toBe(11); // 20-1-8（下から9）
  });

  it("uses template body width for suuji wrap (not bare v2 width)", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "suuji_ashiato_standard" });
    const body = plan.slotsPercent.body!;
    const compact = getAshiatoHorizontalBodyCapacity("compact", body, null);
    const generous = getAshiatoHorizontalBodyCapacity("generous", body, null);
    // padding 差し引き後は v2 の floor(604/size) より大きくならない
    expect(compact.baseMaxCharsPerLine).toBeLessThanOrEqual(40);
    expect(generous.baseMaxCharsPerLine).toBeLessThanOrEqual(37);
    expect(compact.baseMaxCharsPerLine).toBeGreaterThanOrEqual(38);
  });

  it("caps irodori max lines for generous and compact", () => {
    const plan = resolveAshiatoEntryRenderPlan({ pageTemplate: "suuji_ashiato_irodori" });
    expect(plan.bodyTextLayout?.maxLinesByMode).toMatchObject({
      generous: 9,
      compact: 10,
    });
    const body = plan.slotsPercent.body!;
    expect(getAshiatoHorizontalBodyCapacity("generous", body, plan.bodyTextLayout).maxLines).toBe(9);
    expect(getAshiatoHorizontalBodyCapacity("compact", body, plan.bodyTextLayout).maxLines).toBe(10);
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

  it("maps punctuation to vertical presentation forms for display", () => {
    expect(isAshiatoVerticalPunctuation("。")).toBe(true);
    expect(isAshiatoVerticalPunctuation("、")).toBe(true);
    expect(isAshiatoVerticalPunctuation("木")).toBe(false);
    expect(ashiatoVerticalDisplayChar("。")).toBe("\uFE12");
    expect(ashiatoVerticalDisplayChar("、")).toBe("\uFE11");
    expect(ashiatoVerticalDisplayChar("木")).toBe("木");
  });

  it("splits vertical columns", () => {
    const cols = splitVerticalJapaneseColumns("あいうえおかきくけこ", 5, 3);
    expect(cols).toEqual(["あいうえお", "かきくけこ"]);
  });

  it("avoids starting a vertical column with punctuation", () => {
    // 5字で切ると次列が「。」から始まる → 1字戻して「お。」を次列へ
    const cols = splitVerticalJapaneseColumns("あいうえお。かき", 5, 3);
    expect(cols[0]).toBe("あいうえ");
    expect(cols[1]).toBe("お。かき");
    expect(cols.every((col) => !/^[、。！？]/.test(col.replace(/^　+/, "")))).toBe(true);
  });

  it("strips trailing tag lines from ashiato body display", () => {
    expect(normalizeAshiatoBodyContent("今日は楽しかった。\n\n#モグ #おでかけ")).toBe(
      "今日は楽しかった。",
    );
    expect(getAshiatoVerticalBodyColumns("絵日記です。\n\n#森", 20, 3)).toEqual(["絵日記です。"]);
    expect(
      getAshiatoHorizontalBodyLayoutLines(
        "余白ノートです。\n\n#家族",
        "standard",
        { left: 10, top: 40, width: 80, height: 30 },
        null,
      ).join(""),
    ).toContain("余白ノートです。");
    expect(
      getAshiatoHorizontalBodyLayoutLines(
        "余白ノートです。\n\n#家族",
        "standard",
        { left: 10, top: 40, width: 80, height: 30 },
        null,
      ).join(""),
    ).not.toContain("#");
  });

  describe("ashiatoEntryBodyLengthFlag", () => {
    it("marks short content ok on suuji_ashiato_standard", () => {
      expect(
        ashiatoEntryBodyLengthFlag({
          content: "短い本文です。",
          contentFontMode: "standard",
          pageTemplate: "suuji_ashiato_standard",
        }),
      ).toBe("ok");
    });

    it("marks long content soft then strong on suuji_ashiato_standard", () => {
      const plan = resolveAshiatoEntryRenderPlan({
        pageTemplate: "suuji_ashiato_standard",
      });
      const body = plan.slotsPercent.body;
      expect(body).toBeTruthy();
      const capacity = getAshiatoHorizontalBodyCapacity(
        "standard",
        body!,
        plan.bodyTextLayout,
      );

      const softContent = Array.from(
        { length: capacity.maxLines + 1 },
        () => "あ",
      ).join("\n");
      expect(
        ashiatoEntryBodyLengthFlag({
          content: softContent,
          contentFontMode: "standard",
          pageTemplate: "suuji_ashiato_standard",
        }),
      ).toBe("soft");

      const strongContent = Array.from(
        { length: capacity.maxLines + 3 },
        () => "あ",
      ).join("\n");
      expect(
        ashiatoEntryBodyLengthFlag({
          content: strongContent,
          contentFontMode: "standard",
          pageTemplate: "suuji_ashiato_standard",
        }),
      ).toBe("strong");
    });

    it("falls back to layout length flag when pageTemplate omitted", () => {
      expect(
        ashiatoEntryBodyLengthFlag({
          content: "短い",
          contentFontMode: "standard",
        }),
      ).toBe("ok");
    });
  });
});
