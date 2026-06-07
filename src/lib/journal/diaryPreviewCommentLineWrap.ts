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

/** 本文スロット高さ 173px・lineHeight≈1.58 の近似 */
export const DIARY_COMMENT_MAX_LINES = 8;

/** 段落（\n\n）間の追加余白（724×1024 基準 px） */
export const DIARY_COMMENT_PARAGRAPH_GAP_PX = 6;

/** 段落区切りを 0.5 行分として枠高さに換算 */
export const DIARY_COMMENT_PARAGRAPH_GAP_LINE_UNITS = 0.5;

const LINE_START_PROHIBITED = new Set(
  "、。，．）』」〕】》〉ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮゝゞー",
);

const LINE_END_PROHIBITED = new Set("「『（【〔《〈");

/** 行末で切ってよい句読点（この直後で改行を優先） */
const PREFERRED_BREAK_AFTER_CHARS = ["。", "、"] as const;

/** 行の最低埋め率（これより手前では句読点優先改行しない） */
const MIN_LINE_FILL_RATIO = 0.5;

/** 行頭に来ると不自然になりやすい助動詞・接続の先頭（簡易） */
const AUXILIARY_HEAD_PATTERNS = [
  "かもしれ",
  "かも",
  "では",
  "には",
  "てい",
  "でき",
  "なる",
  "する",
  "った",
  "って",
  "から",
  "まで",
  "より",
  "ので",
  "のに",
  "ため",
  "よう",
  "とい",
  "とは",
  "なってい",
  "ています",
  "でしょう",
] as const;

export type DiaryCommentLayoutItem =
  | { kind: "text"; text: string }
  | { kind: "paragraph-gap" };

export type WrapJapaneseTextForDiaryCommentOptions = {
  maxCharsPerLine?: number;
};

function isKanji(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

function isHiragana(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code >= 0x3040 && code <= 0x309f;
}

function isKatakana(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code >= 0x30a0 && code <= 0x30ff;
}

/** 送り仮名・複合語・助動詞の途中で切らない（簡易） */
function canBreakBetween(
  prev: string,
  next: string,
  text?: string,
  breakAt?: number,
): boolean {
  if (!prev || !next) return true;
  if (LINE_END_PROHIBITED.has(prev)) return false;
  if (LINE_START_PROHIBITED.has(next)) return false;
  if (isKanji(prev) && (isHiragana(next) || isKatakana(next))) return false;
  if (isHiragana(prev) && isHiragana(next) && "ぁぃぅぇぉっゃゅょゎ".includes(next)) {
    return false;
  }
  if (text != null && breakAt != null && isHiragana(prev) && isHiragana(next)) {
    const head = text.slice(breakAt, breakAt + 10);
    if (AUXILIARY_HEAD_PATTERNS.some((pattern) => head.startsWith(pattern))) {
      return false;
    }
    if (
      /^(た)?かもしれ|たかも|なってい|ています|でしょう|につながり|になりそう|ていきます|できました|でした|しました|ました|ません/.test(
        head,
      )
    ) {
      return false;
    }
  }
  return true;
}

function isValidBreakAt(text: string, breakAt: number, start: number): boolean {
  if (breakAt <= start || breakAt > text.length) return false;
  if (
    breakAt < text.length &&
    !canBreakBetween(text[breakAt - 1]!, text[breakAt]!, text, breakAt)
  ) {
    return false;
  }
  if (breakAt > start && LINE_END_PROHIBITED.has(text[breakAt - 1]!)) {
    return false;
  }
  if (breakAt < text.length && LINE_START_PROHIBITED.has(text[breakAt]!)) {
    return false;
  }
  return true;
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

function findKinsokuBreak(text: string, start: number, idealEnd: number): number {
  let breakAt = idealEnd;

  while (
    breakAt > start &&
    !canBreakBetween(text[breakAt - 1]!, text[breakAt]!, text, breakAt)
  ) {
    breakAt -= 1;
  }

  while (breakAt > start && LINE_END_PROHIBITED.has(text[breakAt - 1]!)) {
    breakAt -= 1;
  }

  while (breakAt < text.length && LINE_START_PROHIBITED.has(text[breakAt]!)) {
    breakAt -= 1;
  }

  return breakAt;
}

function findLineBreakIndex(text: string, start: number, maxCharsPerLine: number): number {
  const idealEnd = Math.min(start + maxCharsPerLine, text.length);
  if (idealEnd >= text.length) return text.length;

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

function mergeOrphanCommentLines(lines: string[]): string[] {
  if (lines.length === 0) return [];

  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev != null && shouldMergeOrphanLine(line)) {
      merged[merged.length - 1] = prev + line;
    } else {
      merged.push(line);
    }
  }
  return merged;
}

function shouldMergeOrphanLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.length <= PDF_MIN_NEXT_LINE_CHARS) return true;
  return isAwkwardLineStart(trimmed);
}

/** PDF 製本用：段落なし・孤立行マージ後の行配列 */
export function getDiaryCommentPdfLinesForBinding(text: string): string[] {
  const normalized = normalizeDiaryCommentForPdfFlow(text);
  if (!normalized) return [];

  const wrapped = wrapJapaneseTextForDiaryComment(normalized, {
    maxCharsPerLine: DIARY_COMMENT_PDF_CHARS_PER_LINE,
  });
  return mergeOrphanCommentLines(wrapped)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, DIARY_COMMENT_MAX_LINES);
}

export function isDiaryCommentOverPdfLineLimit(text: string): boolean {
  const normalized = normalizeDiaryCommentForPdfFlow(text);
  if (!normalized) return false;

  const wrapped = wrapJapaneseTextForDiaryComment(normalized, {
    maxCharsPerLine: DIARY_COMMENT_PDF_CHARS_PER_LINE,
  });
  const merged = mergeOrphanCommentLines(wrapped);
  return merged.length > DIARY_COMMENT_MAX_LINES;
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
