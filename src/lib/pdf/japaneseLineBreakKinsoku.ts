const LINE_START_PROHIBITED = new Set(
  "、。，．）』」〕】》〉ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮゝゞー",
);

const LINE_END_PROHIBITED = new Set("「『（【〔《〈");

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
export function canBreakBetweenJapaneseChars(
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

export function isValidJapaneseLineBreakAt(text: string, breakAt: number, start: number): boolean {
  if (breakAt <= start || breakAt > text.length) return false;
  if (
    breakAt < text.length &&
    !canBreakBetweenJapaneseChars(text[breakAt - 1]!, text[breakAt]!, text, breakAt)
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

/** 指定位置から禁則に従って手前へ改行位置をずらす */
export function adjustJapaneseBreakForKinsoku(
  text: string,
  start: number,
  breakAt: number,
): number {
  let adjusted = breakAt;

  while (
    adjusted > start &&
    adjusted < text.length &&
    !canBreakBetweenJapaneseChars(
      text[adjusted - 1]!,
      text[adjusted]!,
      text,
      adjusted,
    )
  ) {
    adjusted -= 1;
  }

  while (adjusted > start && LINE_END_PROHIBITED.has(text[adjusted - 1]!)) {
    adjusted -= 1;
  }

  while (adjusted < text.length && LINE_START_PROHIBITED.has(text[adjusted]!)) {
    adjusted -= 1;
  }

  return adjusted;
}
