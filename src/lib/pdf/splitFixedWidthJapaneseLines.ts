/** 次行先頭に来ると不自然な1文字 */
const LINE_START_PULLBACK_CHARS = new Set(
  "、。，．」』）〉》】〕ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー",
);

/** 行末に来ると不自然な1文字（開きカギカッコなど） */
const LINE_END_PULLBACK_CHARS = new Set("「『（【");

const QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["『", "』"],
  ["「", "」"],
];

function countChar(text: string, ch: string): number {
  let n = 0;
  for (const c of text) {
    if (c === ch) n += 1;
  }
  return n;
}

function minHeadChars(maxChars: number): number {
  return Math.min(10, Math.max(4, Math.floor(maxChars * 0.3)));
}

/**
 * 機械分割点がカギカッコの途中なら、開き括弧の直前か閉じ括弧の直後へずらす。
 * 1文字引き戻しだけでは直らない『…』「…」の分割向け。
 */
function findQuoteAwareBreak(
  text: string,
  start: number,
  initialBreak: number,
  maxChars: number,
): number | null {
  const segment = text.slice(start, initialBreak);
  const minHead = minHeadChars(maxChars);
  let bestBeforeOpen: number | null = null;
  let bestAfterClose: number | null = null;

  for (const [open, close] of QUOTE_PAIRS) {
    if (countChar(segment, open) <= countChar(segment, close)) continue;

    const openPos = start + segment.lastIndexOf(open);
    if (openPos > start) {
      const headLen = openPos - start;
      if (headLen >= minHead) {
        bestBeforeOpen =
          bestBeforeOpen == null ? openPos : Math.max(bestBeforeOpen, openPos);
      }
    }

    const closePos = text.indexOf(close, initialBreak);
    if (closePos >= 0) {
      const afterClose = closePos + 1;
      const lineLen = afterClose - start;
      if (lineLen <= maxChars && afterClose > start) {
        bestAfterClose =
          bestAfterClose == null ? afterClose : Math.min(bestAfterClose, afterClose);
      }
    }
  }

  if (bestBeforeOpen != null) return bestBeforeOpen;
  if (bestAfterClose != null) return bestAfterClose;

  for (const [open, close] of QUOTE_PAIRS) {
    if (countChar(segment, open) <= countChar(segment, close)) continue;
    const openPos = start + segment.lastIndexOf(open);
    if (openPos > start) return openPos;
  }

  return null;
}

export function collapsePdfBodyFlowText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n\n+/g, " ")
    .replace(/\n/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findNextFixedWidthBreakIndex(text: string, start: number, maxChars: number): number {
  if (start >= text.length) return start;

  let breakAt = Math.min(start + maxChars, text.length);
  if (breakAt >= text.length) return breakAt;

  const quoteBreak = findQuoteAwareBreak(text, start, breakAt, maxChars);
  if (quoteBreak != null && quoteBreak > start) {
    breakAt = quoteBreak;
  }

  while (breakAt > start + 1) {
    if (breakAt < text.length && LINE_START_PULLBACK_CHARS.has(text[breakAt])) {
      breakAt -= 1;
      continue;
    }
    if (LINE_END_PULLBACK_CHARS.has(text[breakAt - 1])) {
      breakAt -= 1;
      continue;
    }
    break;
  }

  return breakAt;
}

/**
 * ① maxChars 文字で機械分割（単語途中でも切る）
 * ② カギカッコ（『』「」）の途中では、開き直前か閉じ直後へずらす
 * ③ 次行先頭が句読点・閉じ括弧・小書き仮名・伸ばし棒のとき、または行末が開き括弧のとき1文字手前へ
 */
export function splitFixedWidthJapaneseLines(text: string, maxChars: number): string[] {
  const normalized = collapsePdfBodyFlowText(text);
  if (!normalized) return [];

  const lines: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const breakAt = findNextFixedWidthBreakIndex(normalized, start, maxChars);
    if (breakAt <= start) {
      lines.push(normalized.slice(start, start + 1));
      start += 1;
      continue;
    }
    lines.push(normalized.slice(start, breakAt));
    start = breakAt;
  }

  return lines;
}

/**
 * 原稿の空行（\\n\\n）で大ブロックを維持し、各ブロック内だけ固定文字数分割。
 * パーソナルイヤー9年分など、話題の切り替え位置を崩さない用途向け。
 */
export function splitFixedWidthJapaneseLinesByDoubleNewlineBlocks(
  text: string,
  maxChars: number,
): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((block) =>
      block
        .replace(/\n/g, " ")
        .replace(/\u00A0/g, " ")
        .replace(/\u200B/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return blocks.map((block) => splitFixedWidthJapaneseLines(block, maxChars));
}

const SENTENCE_SPLIT = /(?<=。)/;

/**
 * 「。」ごとに文を分け、各文の中だけ固定文字数分割。
 * ブリッジ「持つあなたへ」向け（文と文のあいだだけ sentenceLineGap を付け、文内折り返し行は詰める）。
 */
export function splitFixedWidthJapaneseLinesBySentences(
  text: string,
  maxChars: number,
): string[][] {
  const flow = collapsePdfBodyFlowText(text);
  if (!flow) return [];

  const sentences = flow
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((sentence) => splitFixedWidthJapaneseLines(sentence, maxChars));
}
