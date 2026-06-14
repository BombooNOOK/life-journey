import {
  findJapaneseQuoteAwareBreak,
  splitFixedWidthJapaneseLines,
} from "@/lib/pdf/splitFixedWidthJapaneseLines";
import {
  adjustJapaneseBreakForKinsoku,
  isValidJapaneseLineBreakAt,
} from "@/lib/pdf/japaneseLineBreakKinsoku";

/**
 * 製本読み解き欄の行分割（724×1024・contentWidthPx 360 前提）。
 * プレビューは段落あり。PDF は normalizeDiaryCommentForPdfFlow でぶっ通しに近い1文表示。
 */

/** 360px 枠・12px×0.97 系フォントの近似（全角主体） */
export const DIARY_COMMENT_CHARS_PER_LINE = 30;

/** PDF 用：段落なしのとき少し長めに許容 */
export const DIARY_COMMENT_PDF_CHARS_PER_LINE = 31;

/** 次行がこれ以下なら前行に吸収（PDF） */
const PDF_MIN_NEXT_LINE_CHARS = 4;

/** 行末を少し超えても孤立行を避ける（PDF・全角文字数） */
const PDF_SOFT_LINE_OVERFLOW_CHARS = 5;

/** 読み解き欄の最大行数（日記ブック v2：5行以内） */
export const DIARY_COMMENT_MAX_LINES = 5;

/** 段落（\n\n）間の追加余白（724×1024 基準 px） */
export const DIARY_COMMENT_PARAGRAPH_GAP_PX = 6;

/** 段落区切りを 0.5 行分として枠高さに換算 */
export const DIARY_COMMENT_PARAGRAPH_GAP_LINE_UNITS = 0.5;

/** 行末で切ってよい句読点（この直後で改行を優先） */
const PREFERRED_BREAK_AFTER_CHARS = ["。", "、"] as const;

/** 行の最低埋め率（プレビュー用 wrap：これより手前では句読点優先改行しない） */
const MIN_LINE_FILL_RATIO = 0.5;

export type DiaryCommentLayoutItem =
  | { kind: "text"; text: string }
  | { kind: "paragraph-gap" };

export type WrapJapaneseTextForDiaryCommentOptions = {
  maxCharsPerLine?: number;
};

function isValidBreakAt(text: string, breakAt: number, start: number): boolean {
  return isValidJapaneseLineBreakAt(text, breakAt, start);
}

function findKinsokuBreak(text: string, start: number, idealEnd: number): number {
  return adjustJapaneseBreakForKinsoku(text, start, idealEnd);
}

function findPreferredPunctuationBreak(
  text: string,
  start: number,
  idealEnd: number,
  maxCharsPerLine: number,
): number | null {
  const minBreak = Math.min(
    start + Math.max(10, Math.floor(maxCharsPerLine * MIN_LINE_FILL_RATIO)),
    idealEnd - 1,
  );

  for (const punct of PREFERRED_BREAK_AFTER_CHARS) {
    for (let index = idealEnd - 1; index >= minBreak; index -= 1) {
      if (text[index] !== punct) continue;
      const breakAt = index + 1;
      if (isValidBreakAt(text, breakAt, start)) return breakAt;
    }
  }

  return null;
}

function findLineBreakIndex(text: string, start: number, maxCharsPerLine: number): number {
  const idealEnd = Math.min(start + maxCharsPerLine, text.length);
  if (idealEnd >= text.length) return text.length;

  const quoteBreak = findJapaneseQuoteAwareBreak(text, start, idealEnd, maxCharsPerLine);
  if (quoteBreak != null && quoteBreak > start && isValidBreakAt(text, quoteBreak, start)) {
    const remaining = text.length - quoteBreak;
    if (remaining <= 2) return text.length;
    return quoteBreak;
  }

  const punctuationBreak = findPreferredPunctuationBreak(text, start, idealEnd, maxCharsPerLine);
  if (punctuationBreak != null) {
    const remaining = text.length - punctuationBreak;
    if (remaining <= 2) return text.length;
    return punctuationBreak;
  }

  const breakAt = findKinsokuBreak(text, start, idealEnd);

  const remaining = text.length - breakAt;
  if (remaining > 0 && remaining <= PDF_MIN_NEXT_LINE_CHARS) {
    if (idealEnd - start <= maxCharsPerLine + PDF_SOFT_LINE_OVERFLOW_CHARS) {
      return text.length;
    }
  }

  if (breakAt < text.length && isAwkwardLineStart(text.slice(breakAt, breakAt + 6))) {
    if (idealEnd - start <= maxCharsPerLine + PDF_SOFT_LINE_OVERFLOW_CHARS) {
      return text.length;
    }
    const earlier = findPreferredPunctuationBreak(text, start, breakAt, maxCharsPerLine);
    if (earlier != null && earlier > start) return earlier;
  }

  if (breakAt <= start) {
    return idealEnd;
  }

  return breakAt;
}

function isAwkwardLineStart(fragment: string): boolean {
  if (!fragment) return false;
  if (fragment.length <= 3) return true;
  return /^(日。|に|は、|を|が|の|と|て|も|で、|から|まで|より|ので|のに|ため|よう|になり|につな)/.test(
    fragment,
  );
}

/** PDF：段落・改行を潰して1文として流す */
export function normalizeDiaryCommentForPdfFlow(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n\n+/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/。 +/g, "。")
    .trim();
}

/** PDF 製本用：段落なしの行配列（字数上限＋括弧引き戻し） */
export function getDiaryCommentLinesForBindingAtWidth(
  text: string,
  maxCharsPerLine: number,
  options?: { maxLines?: number },
): string[] {
  const normalized = normalizeDiaryCommentForPdfFlow(text);
  if (!normalized) return [];

  const lines = splitFixedWidthJapaneseLines(normalized, maxCharsPerLine)
    .map((line) => line.trim())
    .filter(Boolean);
  if (options?.maxLines != null) {
    return lines.slice(0, options.maxLines);
  }
  return lines;
}

/** PDF 製本用：段落なし・孤立行マージ後の行配列 */
export function getDiaryCommentPdfLinesForBinding(text: string): string[] {
  return getDiaryCommentLinesForBindingAtWidth(text, DIARY_COMMENT_PDF_CHARS_PER_LINE, {
    maxLines: DIARY_COMMENT_MAX_LINES,
  });
}

export function isDiaryCommentOverPdfLineLimit(text: string): boolean {
  const normalized = normalizeDiaryCommentForPdfFlow(text);
  if (!normalized) return false;

  const lines = splitFixedWidthJapaneseLines(normalized, DIARY_COMMENT_PDF_CHARS_PER_LINE);
  return lines.length > DIARY_COMMENT_MAX_LINES;
}

export function wrapJapaneseTextForDiaryComment(
  paragraph: string,
  options: WrapJapaneseTextForDiaryCommentOptions = {},
): string[] {
  const text = paragraph.trim();
  if (!text) return [];

  const maxCharsPerLine = options.maxCharsPerLine ?? DIARY_COMMENT_CHARS_PER_LINE;
  const lines: string[] = [];
  let index = 0;

  while (index < text.length) {
    const breakAt = findLineBreakIndex(text, index, maxCharsPerLine);
    lines.push(text.slice(index, breakAt));
    index = breakAt;
  }

  return lines;
}

export function splitDiaryCommentParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\n+/g, "").trim())
    .filter(Boolean);
}

export function layoutDiaryComment(
  text: string,
  options: WrapJapaneseTextForDiaryCommentOptions = {},
): DiaryCommentLayoutItem[] {
  const paragraphs = splitDiaryCommentParagraphs(text);
  if (paragraphs.length === 0) return [];

  const items: DiaryCommentLayoutItem[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (paragraphIndex > 0) {
      items.push({ kind: "paragraph-gap" });
    }
    for (const line of wrapJapaneseTextForDiaryComment(paragraph, options)) {
      items.push({ kind: "text", text: line });
    }
  });

  return items;
}

export function estimateDiaryCommentLayoutLineUnits(items: DiaryCommentLayoutItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum + (item.kind === "paragraph-gap" ? DIARY_COMMENT_PARAGRAPH_GAP_LINE_UNITS : 1),
    0,
  );
}

/** 製本 PDF / プレビューに載せる行（超過分は切り捨て） */
export function getDiaryCommentLayoutForBinding(
  text: string,
  options: WrapJapaneseTextForDiaryCommentOptions = {},
): DiaryCommentLayoutItem[] {
  const items = layoutDiaryComment(text, options);
  const bound: DiaryCommentLayoutItem[] = [];
  let used = 0;

  for (const item of items) {
    const cost = item.kind === "paragraph-gap" ? DIARY_COMMENT_PARAGRAPH_GAP_LINE_UNITS : 1;
    if (used + cost > DIARY_COMMENT_MAX_LINES) break;
    bound.push(item);
    used += cost;
  }

  return bound;
}

export function isDiaryCommentOverLineLimit(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const full = layoutDiaryComment(trimmed);
  const bound = getDiaryCommentLayoutForBinding(trimmed);

  if (estimateDiaryCommentLayoutLineUnits(full) > DIARY_COMMENT_MAX_LINES) {
    return true;
  }

  const fullTextLineCount = full.filter((item) => item.kind === "text").length;
  const boundTextLineCount = bound.filter((item) => item.kind === "text").length;
  return boundTextLineCount < fullTextLineCount;
}
