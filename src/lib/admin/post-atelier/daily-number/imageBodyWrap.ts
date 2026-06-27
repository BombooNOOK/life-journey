/** サーバー専用（合成・検証）。node:fs を使う svgText とは分離し、クライアントバンドルに載せない。 */

export type ImageBodyWrappedLine = {
  text: string;
  indentChars: number;
};

function wrapPlainTextLines(
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

/** 画像本文1行目：「今日の「N」の空気は、」をまとめて1行にする */
export const DAILY_NUMBER_IMAGE_BODY_OPENING_RE = /^今日の「\d+」の空気は、/;

/**
 * 個別ページ画像用の改行。
 * 1行目は「今日の「N」の空気は、」までを折り返さず1行、以降は continuationMaxCharsPerLine ごと。
 */
export function wrapDailyNumberImageBody(
  text: string,
  options?: { continuationMaxCharsPerLine?: number; maxLines?: number },
): ImageBodyWrappedLine[] {
  const continuationMaxCharsPerLine = options?.continuationMaxCharsPerLine ?? 13;
  const maxLines = options?.maxLines ?? 4;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const prefixMatch = normalized.match(DAILY_NUMBER_IMAGE_BODY_OPENING_RE);
  if (!prefixMatch) {
    return wrapPlainTextLines(normalized, continuationMaxCharsPerLine, maxLines).map((line) => ({
      text: line,
      indentChars: 0,
    }));
  }

  const prefix = prefixMatch[0];
  const rest = normalized.slice(prefix.length);
  const lines: ImageBodyWrappedLine[] = [{ text: prefix, indentChars: 0 }];

  if (rest && lines.length < maxLines) {
    for (const line of wrapPlainTextLines(rest, continuationMaxCharsPerLine, maxLines - 1)) {
      lines.push({ text: line, indentChars: 0 });
    }
  }

  return lines.slice(0, maxLines);
}

export function countDailyNumberImageBodyShownChars(
  text: string,
  options?: { continuationMaxCharsPerLine?: number; maxLines?: number },
): number {
  return wrapDailyNumberImageBody(text, options).reduce((sum, line) => sum + line.text.length, 0);
}
