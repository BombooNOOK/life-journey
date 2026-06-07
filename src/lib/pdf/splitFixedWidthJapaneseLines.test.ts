import { describe, expect, it } from "vitest";

import {
  splitFixedWidthJapaneseLines,
  splitFixedWidthJapaneseLinesByDoubleNewlineBlocks,
  splitFixedWidthJapaneseLinesBySentences,
} from "@/lib/pdf/splitFixedWidthJapaneseLines";
import { bridgeProfiles } from "@/lib/numerology/bridgeProfiles";
import { personalYearCycleEntry } from "@/lib/numerology/data/personalYearCycleData";

describe("splitFixedWidthJapaneseLines", () => {
  it("splits at maxChars and pulls back for line-start punctuation", () => {
    const text = `${"あ".repeat(33)}。${"い".repeat(5)}`;
    const lines = splitFixedWidthJapaneseLines(text, 34);
    expect(lines[0]).toBe(`${"あ".repeat(33)}。`);
    expect(lines[1]).toBe("い".repeat(5));
  });

  it("preserves personal year cycle 8 text across three double-newline blocks", () => {
    const article = personalYearCycleEntry(8).article;
    const blocks = splitFixedWidthJapaneseLinesByDoubleNewlineBlocks(article, 34);
    expect(blocks).toHaveLength(3);
    expect(blocks.flat().join("")).toBe(article.replace(/\r\n/g, "\n").replace(/\n/g, ""));
    expect(blocks.every((lines) => lines.every((line) => line.length <= 34))).toBe(true);
    expect(blocks.flat().some((line) => /^[、。っゃゅょぁー]/.test(line))).toBe(false);
  });

  it("splits bridge article by sentence then fixed width at 33 chars", () => {
    const article = bridgeProfiles["00"].article;
    const sentences = splitFixedWidthJapaneseLinesBySentences(article, 33);
    expect(sentences.length).toBeGreaterThan(5);
    expect(sentences.flat().join("")).toBe(article.replace(/\s+/g, ""));
    expect(
      sentences.every((lines) => lines.every((line) => line.length <= 33 && line.length > 0)),
    ).toBe(true);
    expect(sentences.flat().some((line) => /^[、。っゃゅょぁー」』]/.test(line))).toBe(false);
  });

  it("does not split inside corner quotes for bridge 00", () => {
    const article = bridgeProfiles["00"].article;
    const lines = splitFixedWidthJapaneseLinesBySentences(article, 33).flat();
    for (const line of lines) {
      const opens = (line.match(/[「『]/g) ?? []).length;
      const closes = (line.match(/[」』]/g) ?? []).length;
      expect(opens).toBe(closes);
    }
    expect(lines.some((line) => line.includes("『どちらを選べばよいのだろう』"))).toBe(true);
    expect(lines.some((line) => line.includes("『今のやり方だけで見ようとしていないだろうか』"))).toBe(
      true,
    );
  });

  it("keeps short corner quotes on one line when they fit", () => {
    const text = `${"あ".repeat(20)}『短い』${"い".repeat(5)}。`;
    const lines = splitFixedWidthJapaneseLines(text, 33);
    expect(lines.join("")).toBe(text);
    expect(lines.some((line) => line.includes("『短い』"))).toBe(true);
  });
});
