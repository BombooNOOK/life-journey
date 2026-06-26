import { describe, expect, it } from "vitest";
import { buildActionLinesSvg, buildSvgTextOverlay, wrapBulletActionLines, wrapTextWithLineRules } from "./svgText";

describe("wrapBulletActionLines", () => {
  it("1行目は・分を除いた文字数で折り返す", () => {
    expect(
      wrapBulletActionLines("あいうえおかきくけこさしすせそ", 13, 2),
    ).toEqual([
      { text: "あいうえおかきくけこさし", isContinuation: false },
      { text: "すせそ", isContinuation: true },
    ]);
  });
});

describe("buildActionLinesSvg", () => {
  it("続き行は1文字分右にずらして描画する", () => {
    const svg = buildActionLinesSvg({
      actions: ["あいうえおかきくけこさしすせそ", "短い"],
      x: 450,
      y: 480,
      fontSize: 17,
      lineHeight: 26,
      maxCharsPerLine: 13,
    });

    expect(svg).toContain('<tspan x="450" dy="0">');
    expect(svg).toContain('<tspan x="467" dy="26">');
    expect(svg).toContain("・あいうえおかきくけこさし");
    expect(svg).not.toContain("・すせそ");
  });
});

describe("wrapTextWithLineRules", () => {
  const personalTopRules = [
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 8, indentChars: 5 },
    { maxCharsPerLine: 8, indentChars: 5 },
    { maxCharsPerLine: 4, indentChars: 9 },
  ] as const;

  it("行ごとの改行幅とインデントで折り返す", () => {
    const text = "あ".repeat(57);
    expect(
      wrapTextWithLineRules(text, [
        { maxCharsPerLine: 13, indentChars: 0 },
        { maxCharsPerLine: 13, indentChars: 0 },
        { maxCharsPerLine: 13, indentChars: 0 },
        { maxCharsPerLine: 10, indentChars: 3 },
        { maxCharsPerLine: 8, indentChars: 5 },
      ]),
    ).toEqual([
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(10), indentChars: 3 },
      { text: "あ".repeat(8), indentChars: 5 },
    ]);
  });

  it("上段本文は5行目を8文字で折り返す", () => {
    const text = "あ".repeat(60);
    expect(wrapTextWithLineRules(text, personalTopRules)).toEqual([
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(13), indentChars: 0 },
      { text: "あ".repeat(8), indentChars: 5 },
    ]);
  });

  it("定義済み rules の後は continuationRule で折り返しを続ける", () => {
    const text = "あ".repeat(78);
    const continuation = { maxCharsPerLine: 8, indentChars: 5 };
    const lines = wrapTextWithLineRules(text, personalTopRules, 8, continuation);
    expect(lines.reduce((sum, line) => sum + line.text.length, 0)).toBe(78);
    expect(lines).toHaveLength(8);
    expect(lines[4]).toEqual({ text: "あ".repeat(8), indentChars: 5 });
    expect(lines[5]).toEqual({ text: "あ".repeat(8), indentChars: 5 });
    expect(lines[6]).toEqual({ text: "あ".repeat(4), indentChars: 9 });
    expect(lines[7]).toEqual({ text: "あ".repeat(6), indentChars: 5 });
  });

  it("全行とも同じ lineHeight で描画し7行目は9文字分インデントする", () => {
    const svg = buildSvgTextOverlay({
      width: 100,
      height: 100,
      items: [
        {
          text: "あ".repeat(78),
          style: {
            x: 100,
            y: 50,
            fontSize: 22,
            lineHeight: 32,
            maxLines: 8,
            lineRules: personalTopRules,
            continuationLineRule: { maxCharsPerLine: 8, indentChars: 5 },
          },
          multiline: true,
        },
      ],
    }).toString("utf8");

    expect(svg).toContain('dy="32"');
    expect(svg).not.toContain('dy="18"');
    expect(svg).toContain('x="298"');
    expect(svg).toContain('x="210"');
  });
});

describe("buildSvgTextOverlay", () => {
  it("指定行以降を文字数分右にずらして描画する", () => {
    const svg = buildSvgTextOverlay({
      width: 100,
      height: 100,
      items: [
        {
          text: "あ".repeat(60),
          style: {
            x: 100,
            y: 50,
            fontSize: 22,
            lineHeight: 32,
            maxCharsPerLine: 13,
            maxLines: 5,
            indentFromLine: 5,
            indentChars: 5,
          },
          multiline: true,
        },
      ],
    }).toString("utf8");

    expect(svg).toContain('<tspan x="100" dy="0">');
    expect(svg).toContain('<tspan x="210"');
  });

  it("lineRules 指定時は行ごとに x をずらす", () => {
    const svg = buildSvgTextOverlay({
      width: 100,
      height: 100,
      items: [
        {
          text: "あ".repeat(50),
          style: {
            x: 100,
            y: 50,
            fontSize: 22,
            lineHeight: 32,
            lineRules: [
              { maxCharsPerLine: 13, indentChars: 0 },
              { maxCharsPerLine: 13, indentChars: 0 },
              { maxCharsPerLine: 13, indentChars: 0 },
              { maxCharsPerLine: 10, indentChars: 3 },
              { maxCharsPerLine: 8, indentChars: 5 },
            ],
          },
          multiline: true,
        },
      ],
    }).toString("utf8");

    expect(svg).toContain('<tspan x="100" dy="0">');
    expect(svg).toContain('<tspan x="166"');
    expect(svg).toContain('<tspan x="210"');
  });
});
