/**
 * PDF 共通の日本語行分割。
 * react-pdf の自動折り返しは使わず、行配列を作って wrap={false} で描画する。
 */

export type WrapJapaneseTextForPdfOptions = {
  maxUnitsPerLine: number;
  maxLines?: number;
  /** 孤立行回避のため行末をわずかに超えてよい幅（units） */
  softOverflowUnits?: number;
};

export type WrapJapaneseTextForPdfResult = {
  lines: string[];
  /** maxLines 指定時、切り捨てがあった */
  truncated: boolean;
  /** 切り捨て前の総行数 */
  totalLineCount: number;
};

const LINE_START_PROHIBITED = new Set(
  "、。，．）』」〕】》〉ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮゝゞー",
);

const LINE_END_PROHIBITED = new Set("「『（【〔《〈");

const AWKWARD_LINE_HEAD =
  /^(に|は、|が|を|で|と|の|も|て|へ|から|まで|より|ので|のに|ため|よう|れが|なっています|がっていきます|日。|になり|につな)/;

const MIN_ORPHAN_HEAD_CHARS = 3;

const DEFAULT_SOFT_OVERFLOW_UNITS = 4;

type SegmenterLike = Intl.Segmenter;

function getJapaneseWordSegmenter(): SegmenterLike | null {
  try {
    if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return null;
    return new Intl.Segmenter("ja", { granularity: "word" });
  } catch {
    return null;
  }
}

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

function isJapaneseChar(char: string): boolean {
  return isKanji(char) || isHiragana(char) || isKatakana(char);
}

/** 表示幅の近似（全角=1） */
export function measureJapaneseTextUnits(text: string): number {
  let units = 0;
  for (const char of text) {
    if (char === " ") units += 0.35;
    else if (/[a-zA-Z0-9]/.test(char)) units += 0.55;
    else if (/[、。，．「」『』（）【】〔〕《》〈〉]/.test(char)) units += 0.5;
    else if (isJapaneseChar(char)) units += 1;
    else units += 0.55;
  }
  return units;
}

function lastChar(text: string): string {
  return text[text.length - 1] ?? "";
}

function firstChar(text: string): string {
  return text[0] ?? "";
}

function endsWithPunctuation(text: string): boolean {
  return /[、。]$/.test(text);
}

function isStandaloneParticle(segment: string): boolean {
  return /^(が|を|に|で|と|の|は|も|へ|や|か|ね|よ|な|だ|で)$/.test(segment);
}

function isConjugationContinuation(nextSegment: string): boolean {
  return /^(た|か|も|し|れ|ま|せん|ます|いき|き|って|い|な|で|てい|でき|より|ので|のに|ため|よう|には|では|から|まで|う|く|け|み|び|げ|ね|め|ら|り|る|す|つ|ぬ|む|び|ぴ|ゃ|ゅ|ょ|ぁ|ぃ|ぅ|ぇ|ぉ|っ|ー)$/.test(
    nextSegment,
  );
}

function shouldContinueMergingToken(buffer: string, nextSegment: string): boolean {
  if (!buffer || !nextSegment) return false;
  if (endsWithPunctuation(buffer)) return false;

  const last = lastChar(buffer);
  const next = firstChar(nextSegment);

  if (isKanji(last) && (isHiragana(next) || isKatakana(next))) return true;
  if (isKanji(last) && isKanji(next)) return false;
  if (isHiragana(last) && isKanji(next)) return false;
  if (isKatakana(last) && isKatakana(next)) return true;

  if (isStandaloneParticle(nextSegment) && measureJapaneseTextUnits(buffer) >= 6) {
    return false;
  }

  if (isConjugationContinuation(nextSegment)) {
    return true;
  }

  if (isHiragana(last) && isHiragana(next)) {
    if (nextSegment.length <= 3) return true;
    if (/[かもしれませんていなってできが]$/.test(buffer)) return true;
    if (isKanji(buffer[buffer.length - 2] ?? "")) return true;
  }

  return false;
}

/** Intl.Segmenter の語単位を、送り仮名・助動詞をまとめた折り返しトークンへ */
export function buildJapaneseWrapTokens(text: string): string[] {
  const segmenter = getJapaneseWordSegmenter();
  if (!segmenter) return fallbackBuildJapaneseWrapTokens(text);

  const rawSegments = [...segmenter.segment(text)]
    .map((part) => part.segment)
    .filter(Boolean);
  if (rawSegments.length === 0) return [];

  const tokens: string[] = [];
  let buffer = rawSegments[0]!;

  for (let index = 1; index < rawSegments.length; index += 1) {
    const next = rawSegments[index]!;
    if (shouldContinueMergingToken(buffer, next)) {
      buffer += next;
    } else {
      tokens.push(buffer);
      buffer = next;
    }
  }
  tokens.push(buffer);
  return tokens;
}

function fallbackBuildJapaneseWrapTokens(text: string): string[] {
  const tokens: string[] = [];
  let buffer = "";

  for (const char of text) {
    if (!buffer) {
      buffer = char;
      continue;
    }

    const pretendNext = char;
    if (shouldContinueMergingToken(buffer, pretendNext) && !endsWithPunctuation(buffer)) {
      buffer += char;
    } else {
      tokens.push(buffer);
      buffer = char;
    }
  }

  if (buffer) tokens.push(buffer);
  return tokens;
}

function canBreakBetweenChars(prev: string, next: string): boolean {
  if (!prev || !next) return true;
  if (LINE_END_PROHIBITED.has(prev)) return false;
  if (LINE_START_PROHIBITED.has(next)) return false;
  if (isKanji(prev) && (isHiragana(next) || isKatakana(next))) return false;
  return true;
}

function isAwkwardLineHead(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.length < MIN_ORPHAN_HEAD_CHARS) return true;
  return AWKWARD_LINE_HEAD.test(trimmed);
}

function wrapOversizedToken(token: string, maxUnitsPerLine: number): string[] {
  if (measureJapaneseTextUnits(token) <= maxUnitsPerLine) return [token];

  const lines: string[] = [];
  let buffer = "";

  for (const char of token) {
    const candidate = buffer + char;
    if (buffer && measureJapaneseTextUnits(candidate) > maxUnitsPerLine) {
      lines.push(buffer);
      buffer = char;
    } else {
      buffer = candidate;
    }
  }
  if (buffer) lines.push(buffer);
  return lines;
}

function packTokensIntoLines(
  tokens: string[],
  maxUnitsPerLine: number,
  softOverflowUnits: number,
): string[] {
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      lines.push(current);
      current = "";
    }
  };

  for (const token of tokens) {
    const tokenParts =
      measureJapaneseTextUnits(token) > maxUnitsPerLine + softOverflowUnits
        ? wrapOversizedToken(token, maxUnitsPerLine)
        : [token];

    for (const part of tokenParts) {
      const partUnits = measureJapaneseTextUnits(part);
      const currentUnits = measureJapaneseTextUnits(current);
      const combined = current + part;
      const combinedUnits = measureJapaneseTextUnits(combined);

      if (!current) {
        current = part;
        continue;
      }

      if (combinedUnits <= maxUnitsPerLine + softOverflowUnits) {
        current = combined;
        continue;
      }

      if (partUnits <= maxUnitsPerLine && currentUnits <= maxUnitsPerLine) {
        pushCurrent();
        current = part;
        continue;
      }

      pushCurrent();
      current = part;
    }
  }

  pushCurrent();
  return lines;
}

function mergeOrphanHeadLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev != null && isAwkwardLineHead(line)) {
      merged[merged.length - 1] = prev + line;
    } else {
      merged.push(line);
    }
  }

  return merged;
}

function fixKinsokuBetweenLines(lines: string[]): string[] {
  if (lines.length <= 1) return lines;

  const fixed = [...lines];
  for (let index = 1; index < fixed.length; index += 1) {
    const prev = fixed[index - 1]!;
    const current = fixed[index]!;
    if (!prev || !current) continue;

    const prevLast = lastChar(prev);
    const currentFirst = firstChar(current);

    if (
      !canBreakBetweenChars(prevLast, currentFirst) ||
      LINE_START_PROHIBITED.has(currentFirst) ||
      LINE_END_PROHIBITED.has(prevLast)
    ) {
      fixed[index - 1] = prev + current;
      fixed[index] = "";
    }
  }

  return fixed.filter(Boolean);
}

/** PDF 用：日本語テキストを行配列に分割 */
export function wrapJapaneseTextForPdf(
  text: string,
  options: WrapJapaneseTextForPdfOptions,
): WrapJapaneseTextForPdfResult {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { lines: [], truncated: false, totalLineCount: 0 };
  }

  const maxUnitsPerLine = options.maxUnitsPerLine;
  const softOverflowUnits = options.softOverflowUnits ?? DEFAULT_SOFT_OVERFLOW_UNITS;

  const tokens = buildJapaneseWrapTokens(normalized);
  let lines = packTokensIntoLines(tokens, maxUnitsPerLine, softOverflowUnits);
  lines = mergeOrphanHeadLines(lines);
  lines = fixKinsokuBetweenLines(lines);
  lines = mergeOrphanHeadLines(lines);

  const totalLineCount = lines.length;
  let truncated = false;

  if (options.maxLines != null && lines.length > options.maxLines) {
    lines = lines.slice(0, options.maxLines);
    truncated = true;
  }

  return { lines, truncated, totalLineCount };
}

export function isJapaneseTextOverPdfLineLimit(
  text: string,
  options: WrapJapaneseTextForPdfOptions,
): boolean {
  const result = wrapJapaneseTextForPdf(text, options);
  return result.truncated || result.totalLineCount > (options.maxLines ?? Number.MAX_SAFE_INTEGER);
}
