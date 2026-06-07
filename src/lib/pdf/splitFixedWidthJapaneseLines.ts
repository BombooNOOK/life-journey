/** 次行先頭に来ると不自然な1文字（このときだけ改行位置を1文字手前にずらす） */
const LINE_START_PULLBACK_CHARS = new Set(
  "、。，．ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー",
);

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

  if (LINE_START_PULLBACK_CHARS.has(text[breakAt]) && breakAt > start + 1) {
    breakAt -= 1;
  }

  return breakAt;
}

/**
 * ① maxChars 文字で機械分割（単語途中でも切る）
 * ② 次行先頭が句読点・小書き仮名・伸ばし棒のときだけ1文字手前で切る
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
