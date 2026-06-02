import { describe, expect, it } from "vitest";

import {
  countBodyLayoutLines,
  DIARY_BODY_CHARS_PER_LINE_BY_MODE,
  DIARY_BODY_MAX_LINES_BY_MODE,
  formatBodyForPreviewDisplay,
  getBodyLayoutLines,
  getBodyLayoutLinesForBindingPreview,
  isDiaryBodyOverLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";

describe("countBodyLayoutLines", () => {
  it("returns 0 for empty content", () => {
    expect(countBodyLayoutLines("", "standard")).toBe(0);
    expect(countBodyLayoutLines("   ", "standard")).toBe(0);
  });

  it("counts manual newlines as separate lines", () => {
    expect(countBodyLayoutLines("a\nb\nc", "standard")).toBe(3);
    expect(countBodyLayoutLines("a\n\nb", "standard")).toBe(3);
  });

  it("wraps long single line by chars per line (standard)", () => {
    const perLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE.standard;
    expect(countBodyLayoutLines("あ".repeat(perLine), "standard")).toBe(1);
    expect(countBodyLayoutLines("あ".repeat(perLine + 1), "standard")).toBe(2);
  });

  it("uses standard limits (32 chars, 6 lines)", () => {
    const perLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE.standard;
    const max = DIARY_BODY_MAX_LINES_BY_MODE.standard;
    expect(perLine).toBe(32);
    expect(max).toBe(6);
    const fits = "あ".repeat(perLine * max);
    expect(isDiaryBodyOverLineLimit(fits, "standard")).toBe(false);
    expect(isDiaryBodyOverLineLimit(`${fits}あ`, "standard")).toBe(true);
  });

  it("uses relaxed limits (28 chars, 4 lines)", () => {
    const perLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE.relaxed;
    const max = DIARY_BODY_MAX_LINES_BY_MODE.relaxed;
    expect(perLine).toBe(28);
    expect(max).toBe(4);
    const fits = "あ".repeat(perLine * max);
    expect(countBodyLayoutLines(fits, "relaxed")).toBe(max);
    expect(isDiaryBodyOverLineLimit(fits, "relaxed")).toBe(false);
    expect(isDiaryBodyOverLineLimit(`${fits}あ`, "relaxed")).toBe(true);
  });

  it("uses generous limits (40 chars, 7 lines)", () => {
    const perLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE.generous;
    const max = DIARY_BODY_MAX_LINES_BY_MODE.generous;
    expect(perLine).toBe(40);
    expect(max).toBe(7);
  });

  it("uses compact limits (44 chars, 8 lines)", () => {
    const perLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE.compact;
    const max = DIARY_BODY_MAX_LINES_BY_MODE.compact;
    expect(perLine).toBe(44);
    expect(max).toBe(8);
  });
});

describe("getBodyLayoutLines", () => {
  it("returns empty array for blank content", () => {
    expect(getBodyLayoutLines("", "standard")).toEqual([]);
    expect(getBodyLayoutLines("   ", "standard")).toEqual([]);
  });

  it("matches countBodyLayoutLines length", () => {
    const samples = ["a\nb\nc", "あ".repeat(50), "a\n\nb", "あ".repeat(41)];
    for (const sample of samples) {
      expect(getBodyLayoutLines(sample, "standard").length).toBe(
        countBodyLayoutLines(sample, "standard"),
      );
    }
  });

  it("wraps at mode-specific chars per line", () => {
    const line = "あ".repeat(50);
    expect(getBodyLayoutLines(line, "standard")).toEqual([
      "あ".repeat(32),
      "あ".repeat(18),
    ]);
    expect(getBodyLayoutLines(line, "relaxed")).toEqual([
      "あ".repeat(28),
      "あ".repeat(22),
    ]);
  });
});

describe("getBodyLayoutLinesForBindingPreview", () => {
  it("returns at most maxLines for the mode", () => {
    const perLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE.standard;
    const max = DIARY_BODY_MAX_LINES_BY_MODE.standard;
    const long = "あ".repeat(perLine * max + 1);
    const standard = getBodyLayoutLinesForBindingPreview(long, "standard");
    expect(standard.length).toBe(max);
    expect(getBodyLayoutLines(long, "standard").length).toBeGreaterThan(max);
  });
});

describe("formatBodyForPreviewDisplay", () => {
  it("joins getBodyLayoutLines with newlines", () => {
    const line = "あ".repeat(50);
    expect(formatBodyForPreviewDisplay(line, "standard")).toBe(
      getBodyLayoutLines(line, "standard").join("\n"),
    );
  });
});
