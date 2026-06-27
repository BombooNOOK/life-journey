import fs from "node:fs";
import path from "node:path";

let cachedFontStyle: string | null = null;

export function loadFontStyleBlock(): string {
  if (cachedFontStyle) return cachedFontStyle;
  const regularPath = path.join(
    process.cwd(),
    "src/components/pdf/assets/fonts/KleeOne-Regular.ttf",
  );
  const semiBoldPath = path.join(
    process.cwd(),
    "src/components/pdf/assets/fonts/KleeOne-SemiBold.ttf",
  );
  const regularB64 = fs.readFileSync(regularPath).toString("base64");
  const semiBoldB64 = fs.readFileSync(semiBoldPath).toString("base64");
  cachedFontStyle = `
@font-face { font-family: 'DailyNumberKlee'; font-weight: 400; src: url('data:font/ttf;base64,${regularB64}') format('truetype'); }
@font-face { font-family: 'DailyNumberKlee'; font-weight: 600; src: url('data:font/ttf;base64,${semiBoldB64}') format('truetype'); }
`;
  return cachedFontStyle;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapTextLines(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const lines: string[] = [];
  let current = "";

  for (const ch of normalized) {
    const next = current + ch;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

export type MultilineLineRule = {
  maxCharsPerLine: number;
  indentChars: number;
};

export type WrappedMultilineLine = {
  text: string;
  indentChars: number;
};

/** 行ごとに改行幅・インデントが異なる本文用（rules 消化後は continuationRule または最後の rule で継続） */
export function wrapTextWithLineRules(
  text: string,
  rules: readonly MultilineLineRule[],
  maxLines?: number,
  continuationRule?: MultilineLineRule,
): WrappedMultilineLine[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || rules.length === 0) return [];

  const lineLimit = maxLines ?? rules.length;
  const lastRule = rules[rules.length - 1]!;
  const overflowRule = continuationRule ?? lastRule;
  const lines: WrappedMultilineLine[] = [];
  let index = 0;

  for (let lineIndex = 0; lineIndex < lineLimit && index < normalized.length; lineIndex += 1) {
    const rule = rules[lineIndex] ?? overflowRule;
    const chunk = normalized.slice(index, index + rule.maxCharsPerLine);
    if (!chunk) break;
    lines.push({ text: chunk, indentChars: rule.indentChars });
    index += chunk.length;
  }

  return lines;
}

/** ・付きリスト用。1行目は「・」+ 本文、続き行は x オフセットでぶら下げインデント */
export type BulletActionLine = {
  text: string;
  isContinuation: boolean;
};

export function wrapBulletActionLines(
  action: string,
  maxCharsPerLine: number,
  maxLines: number,
): BulletActionLine[] {
  const normalized = action.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const lines: BulletActionLine[] = [];
  let index = 0;
  let isFirstLine = true;

  while (index < normalized.length && lines.length < maxLines) {
    const textBudget = isFirstLine ? maxCharsPerLine - 1 : maxCharsPerLine;
    if (textBudget <= 0) break;

    const chunk = normalized.slice(index, index + textBudget);
    if (!chunk) break;

    lines.push({ text: chunk, isContinuation: !isFirstLine });
    index += chunk.length;
    isFirstLine = false;
  }

  return lines;
}

type SvgTextStyle = {
  x: number;
  y: number;
  fontSize: number;
  lineHeight?: number;
  fontWeight?: 400 | 600;
  fill?: string;
  textAnchor?: "start" | "middle" | "end";
  maxCharsPerLine?: number;
  maxLines?: number;
  /** この行番号（1始まり）以降を indentChars 文字分右にずらす */
  indentFromLine?: number;
  indentChars?: number;
  /** 行ごとに改行幅・インデントを指定（指定時は maxCharsPerLine / indentFromLine より優先） */
  lineRules?: readonly MultilineLineRule[];
  /** lineRules 超過行の折り返し（未指定時は最後の rule を継続） */
  continuationLineRule?: MultilineLineRule;
  /** 指定時は内部折り返しをせずこの行配列をそのまま描画 */
  wrappedLines?: WrappedMultilineLine[];
  /** この行番号（1始まり）以降の行間（上段の6行目以降の逃がし用） */
  compactFromLine?: number;
  compactLineHeight?: number;
};

export function buildSvgTextOverlay(input: {
  width: number;
  height: number;
  color?: string;
  items: Array<{ text: string; style: SvgTextStyle; multiline?: boolean }>;
}): Buffer {
  const fill = input.color ?? "#4a3728";
  const parts: string[] = [];

  for (const item of input.items) {
    const style = item.style;
    const anchor = style.textAnchor ?? "start";
    const weight = style.fontWeight ?? 400;
    const itemFill = style.fill ?? fill;
    const anchorAttr =
      anchor === "middle"
        ? `text-anchor="middle"`
        : anchor === "end"
          ? `text-anchor="end"`
          : "";

    if (item.multiline) {
      const lineHeight = style.lineHeight ?? Math.round(style.fontSize * 1.45);

      const lines =
        style.wrappedLines ??
        (style.lineRules?.length
          ? wrapTextWithLineRules(
              item.text,
              style.lineRules,
              style.maxLines ?? style.lineRules.length,
              style.continuationLineRule,
            )
          : null);

      if (lines) {
        parts.push(
          `<text x="${style.x}" y="${style.y}" ${anchorAttr} font-family="DailyNumberKlee" font-size="${style.fontSize}" font-weight="${weight}" fill="${itemFill}">`,
        );
        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i]!;
          const lineNumber = i + 1;
          const dy =
            i === 0
              ? 0
              : style.compactFromLine != null &&
                  style.compactLineHeight != null &&
                  lineNumber >= style.compactFromLine
                ? style.compactLineHeight
                : lineHeight;
          const x = style.x + line.indentChars * style.fontSize;
          parts.push(`<tspan x="${x}" dy="${dy}">${escapeXml(line.text)}</tspan>`);
        }
        parts.push("</text>");
        continue;
      }

      const plainLines = wrapTextLines(
        item.text,
        style.maxCharsPerLine ?? 20,
        style.maxLines ?? 4,
      );
      const indentFromLine = style.indentFromLine ?? Number.POSITIVE_INFINITY;
      const indentChars = style.indentChars ?? 0;
      const indentPx = indentChars * style.fontSize;
      parts.push(
        `<text x="${style.x}" y="${style.y}" ${anchorAttr} font-family="DailyNumberKlee" font-size="${style.fontSize}" font-weight="${weight}" fill="${itemFill}">`,
      );
      for (let i = 0; i < plainLines.length; i += 1) {
        const dy = i === 0 ? 0 : lineHeight;
        const lineNumber = i + 1;
        const x =
          lineNumber >= indentFromLine ? style.x + indentPx : style.x;
        parts.push(`<tspan x="${x}" dy="${dy}">${escapeXml(plainLines[i]!)}</tspan>`);
      }
      parts.push("</text>");
      continue;
    }

    parts.push(
      `<text x="${style.x}" y="${style.y}" ${anchorAttr} font-family="DailyNumberKlee" font-size="${style.fontSize}" font-weight="${weight}" fill="${itemFill}">${escapeXml(item.text)}</text>`,
    );
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${input.width}" height="${input.height}" xmlns="http://www.w3.org/2000/svg">
<defs><style>${loadFontStyleBlock()}</style></defs>
${parts.join("\n")}
</svg>`;

  return Buffer.from(svg);
}

export function buildSvgFromInnerMarkup(input: {
  width: number;
  height: number;
  innerMarkup: string;
  color?: string;
}): Buffer {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${input.width}" height="${input.height}" xmlns="http://www.w3.org/2000/svg">
<defs><style>${loadFontStyleBlock()}</style></defs>
${input.innerMarkup}
</svg>`;
  return Buffer.from(svg);
}

export function buildActionLinesSvg(input: {
  actions: [string, string];
  x: number;
  y: number;
  fontSize: number;
  lineHeight: number;
  maxCharsPerLine: number;
  fill?: string;
}): string {
  const fill = input.fill ?? "#4a3728";
  const lines: BulletActionLine[] = [];
  for (const action of input.actions) {
    lines.push(...wrapBulletActionLines(action, input.maxCharsPerLine, 2));
  }

  const continuationX = input.x + input.fontSize;

  const chunks = [
    `<text x="${input.x}" y="${input.y}" font-family="DailyNumberKlee" font-size="${input.fontSize}" font-weight="400" fill="${fill}">`,
  ];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const dy = i === 0 ? 0 : input.lineHeight;
    const x = line.isContinuation ? continuationX : input.x;
    const content = line.isContinuation ? line.text : `・${line.text}`;
    chunks.push(`<tspan x="${x}" dy="${dy}">${escapeXml(content)}</tspan>`);
  }
  chunks.push("</text>");
  return chunks.join("");
}

/** テスト用にフォントキャッシュをリセット */
export function resetDailyNumberSvgFontCacheForTests(): void {
  cachedFontStyle = null;
}
