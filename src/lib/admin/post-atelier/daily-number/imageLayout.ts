/** テンプレート 819×1024（4:5）上のテキスト配置（px） */

export const DAILY_NUMBER_TEMPLATE_SIZE = {
  widthPx: 819,
  heightPx: 1024,
} as const;

export const DAILY_NUMBER_COVER_LAYOUT = {
  number: { cx: 410, y: 580, fontSize: 96, fontWeight: 600 as const },
  title: { cx: 410, y: 715, fontSize: 26, fontWeight: 600 as const },
  summary: {
    x: 280,
    y: 760,
    width: 604,
    fontSize: 25,
    lineHeight: 38,
    maxCharsPerLine: 12,
    maxLines: 6,
  },
} as const;

export const DAILY_NUMBER_PERSONAL_CARD_TOPS = [118, 500] as const;

const PERSONAL_BODY_SHARED = {
  width: 268,
  fontSize: 22,
  maxLines: 8,
} as const;

/** 5行目以降の継続行（5文字インデント・8文字折り返し） */
const PERSONAL_BODY_CONTINUATION = {
  maxCharsPerLine: 8,
  indentChars: 5,
} as const;

/** 7行目は装飾回避のため9文字インデント・4文字表示 */
const PERSONAL_BODY_LINE_7 = {
  maxCharsPerLine: 4,
  indentChars: 9,
} as const;

const PERSONAL_BODY_TOP = {
  ...PERSONAL_BODY_SHARED,
  lineHeight: 32,
  lineRules: [
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 8, indentChars: 5 },
    { maxCharsPerLine: 8, indentChars: 5 },
    PERSONAL_BODY_LINE_7,
  ],
  continuationLineRule: PERSONAL_BODY_CONTINUATION,
} as const;

const PERSONAL_BODY_BOTTOM = {
  ...PERSONAL_BODY_SHARED,
  lineHeight: 32,
  maxLines: 9,
  lineRules: [
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 10, indentChars: 3 },
    { maxCharsPerLine: 8, indentChars: 5 },
    { maxCharsPerLine: 8, indentChars: 5 },
    PERSONAL_BODY_LINE_7,
  ],
  continuationLineRule: PERSONAL_BODY_CONTINUATION,
} as const;

const PERSONAL_COLOR_BASE = {
  width: 228,
  fontSize: 27,
  align: "middle" as const,
} as const;

const PERSONAL_ACTIONS_BASE = {
  width: 240,
  fontSize: 17,
  lineHeight: 26,
  maxCharsPerLine: 13,
  maxLines: 4,
} as const;

/**
 * 個別ページ・上段/下段のテキスト配置（v1 確定）。
 * cardTop からの相対 y。絶対座標は cardTop + y。
 *
 * 上段 cardTop=118: 本文(100,350) カラー(575,390) 過ごし方(450,480)
 *   本文 1〜4行目=13文字、5〜6行目=8文字+5文字インデント、7行目=4文字+9文字インデント（最大8行・lineHeight 32 均一）
 * 下段 cardTop=500: 本文(100,755) カラー(575,780) 過ごし方(450,870)
 *   本文 1〜3行目=13文字、4行目=10文字+3文字インデント、5〜6行目=8文字+5文字インデント、7行目=4文字+9文字インデント（最大9行・lineHeight 32 均一）
 *
 * 変更時は /preview/post-atelier/daily-number-layout の定規で確認すること。
 */
export const DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS = [
  {
    body: { x: 100, y: 232, ...PERSONAL_BODY_TOP },
    color: { x: 575, y: 272, ...PERSONAL_COLOR_BASE },
    actions: { x: 450, y: 362, ...PERSONAL_ACTIONS_BASE },
  },
  {
    body: { x: 100, y: 255, ...PERSONAL_BODY_BOTTOM },
    color: { x: 575, y: 280, ...PERSONAL_COLOR_BASE },
    actions: { x: 450, y: 370, ...PERSONAL_ACTIONS_BASE },
  },
] as const;

/** @deprecated 上段レイアウトのエイリアス */
export const DAILY_NUMBER_PERSONAL_BLOCK_LAYOUT = DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[0];

export function dailyNumberPersonalBlockLayout(blockIndex: number) {
  return (
    DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[blockIndex] ?? DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[0]
  );
}

export const DAILY_NUMBER_TEXT_COLOR = "#4a3728";
