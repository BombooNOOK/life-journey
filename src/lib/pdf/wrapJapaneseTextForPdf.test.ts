import { describe, expect, it } from "vitest";

import {
  buildJapaneseWrapTokens,
  wrapJapaneseTextForPdf,
} from "@/lib/pdf/wrapJapaneseTextForPdf";

const SAMPLE =
  "仕事や勉強の中でも、いつもと違うやり方や小さな気づきがあったかもしれません。その変化を少し受け入れた分だけ、次の選択肢が静かに広がっていきます。あなたの今日と、今月の流れが「5」で重なっています。いつもと少し違う選択が、次の景色につながりやすい日です。";

describe("buildJapaneseWrapTokens", () => {
  it("keeps compound words as single tokens when possible", () => {
    const tokens = buildJapaneseWrapTokens(SAMPLE);
    const joined = tokens.join("");
    expect(joined).toBe(SAMPLE);
    expect(tokens.some((token) => token.includes("気づき"))).toBe(true);
    expect(tokens.some((token) => token.includes("広がっていきます") || token.includes("広がって"))).toBe(
      true,
    );
    expect(tokens.some((token) => token.includes("重なっています"))).toBe(true);
    expect(tokens.some((token) => token.includes("流れ"))).toBe(true);
  });
});

describe("wrapJapaneseTextForPdf", () => {
  it("avoids mid-word breaks in the sample comment", () => {
    const { lines } = wrapJapaneseTextForPdf(SAMPLE, {
      maxUnitsPerLine: 30,
      maxLines: 8,
    });

    expect(lines.join("")).toBe(SAMPLE);
    expect(lines.some((line) => /気$/.test(line) && !line.includes("気づき"))).toBe(false);
    expect(lines.some((line) => line.startsWith("づき"))).toBe(false);
    expect(lines.some((line) => /広$/.test(line) && !line.includes("広が"))).toBe(false);
    expect(lines.some((line) => line.startsWith("がっていきます"))).toBe(false);
    expect(lines.some((line) => /流$/.test(line) && !line.includes("流れ"))).toBe(false);
    expect(lines.some((line) => line.startsWith("れが"))).toBe(false);
    expect(lines.some((line) => /重$/.test(line) && !line.includes("重な"))).toBe(false);
    expect(lines.some((line) => line.startsWith("なっています"))).toBe(false);
    expect(lines.some((line) => line.length <= 1)).toBe(false);
    expect(lines.length).toBeLessThanOrEqual(8);
  });

  it("truncates when maxLines exceeded", () => {
    const long = `${SAMPLE}${SAMPLE}`;
    const result = wrapJapaneseTextForPdf(long, { maxUnitsPerLine: 20, maxLines: 5 });
    expect(result.lines.length).toBe(5);
    expect(result.truncated).toBe(true);
    expect(result.totalLineCount).toBeGreaterThan(5);
  });
});
