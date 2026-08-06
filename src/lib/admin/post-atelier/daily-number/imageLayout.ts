/** テンプレート 819×1024（4:5）上のテキスト配置（px） */

export const DAILY_NUMBER_TEMPLATE_SIZE = {
  widthPx: 819,
  heightPx: 1024,
} as const;

/** v2 表紙は完成 PNG をそのまま使用。以下は CSV 文案検証・Canva 用コピーのみ */
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

/** 表紙・投稿予定日（地面付近・819×1024 設計座標） */
export const DAILY_NUMBER_COVER_SCHEDULED_DATE_LAYOUT = {
  cx: 410,
  y: 1002,
  fontSize: 20,
  fontWeight: 400 as const,
} as const;

export type DailyNumberPersonalPageSide = "left" | "right";

/** page_01,03,05 = 左ページ / page_02,04,06 = 右ページ */
export function dailyNumberPersonalPageSide(pageIndex1Based: number): DailyNumberPersonalPageSide {
  return pageIndex1Based % 2 === 1 ? "left" : "right";
}

const PERSONAL_V2_BODY = {
  fontSize: 21,
  lineHeight: 34,
  maxLines: 4,
  /** 1行目「今日の「N」の空気は、」のあとは 13 文字で改行 */
  imageBodyContinuationMaxCharsPerLine: 13,
  maxCharsPerLine: 13,
  lineRules: [
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
    { maxCharsPerLine: 13, indentChars: 0 },
  ],
  continuationLineRule: { maxCharsPerLine: 13, indentChars: 0 },
} as const;

const PERSONAL_V2_COLOR = {
  fontSize: 22,
  fontWeight: 600 as const,
} as const;

/** 左ページ（page_01 で確定）— 奇数テンプレ page_01,03,05 */
const PERSONAL_V2_LEFT_PAGE = {
  side: "left" as const,
  header: {
    todayNumber: { cx: 520, y: 227, fontSize: 36, fontWeight: 600 as const },
  },
  blocks: [
    {
      body: { x: 320, y: 420, ...PERSONAL_V2_BODY },
      color: { cx: 485, y: 570, ...PERSONAL_V2_COLOR },
    },
    {
      body: { x: 320, y: 790, ...PERSONAL_V2_BODY },
      color: { cx: 470, y: 947, ...PERSONAL_V2_COLOR },
    },
  ],
} as const;

const PERSONAL_V2_RIGHT_UPPER_COLOR = {
  cx: 485,
  y: 573,
  ...PERSONAL_V2_COLOR,
} as const;

/**
 * 右ページ（偶数テンプレ page_02,04,06）
 * 上段おまもりカラーのみ y を調整。他は左ページと同座標。
 */
const PERSONAL_V2_RIGHT_PAGE = {
  side: "right" as const,
  header: PERSONAL_V2_LEFT_PAGE.header,
  blocks: [
    {
      body: PERSONAL_V2_LEFT_PAGE.blocks[0]!.body,
      color: PERSONAL_V2_RIGHT_UPPER_COLOR,
    },
    PERSONAL_V2_LEFT_PAGE.blocks[1]!,
  ],
} as const;

export type DailyNumberPersonalPageLayoutV2 =
  | typeof PERSONAL_V2_LEFT_PAGE
  | typeof PERSONAL_V2_RIGHT_PAGE;

export function dailyNumberPersonalPageLayout(pageIndex1Based: number): DailyNumberPersonalPageLayoutV2 {
  return dailyNumberPersonalPageSide(pageIndex1Based) === "left"
    ? PERSONAL_V2_LEFT_PAGE
    : PERSONAL_V2_RIGHT_PAGE;
}

export function dailyNumberPersonalBlockLayoutV2(pageIndex1Based: number, blockIndex: number) {
  const page = dailyNumberPersonalPageLayout(pageIndex1Based);
  return page.blocks[blockIndex] ?? page.blocks[0];
}

/** @deprecated v1 カード型。action 検証用に残置 */
export const DAILY_NUMBER_PERSONAL_CARD_TOPS = [118, 500] as const;

const PERSONAL_BODY_CONTINUATION = {
  maxCharsPerLine: 8,
  indentChars: 5,
} as const;

const PERSONAL_BODY_LINE_7 = {
  maxCharsPerLine: 4,
  indentChars: 9,
} as const;

const PERSONAL_BODY_TOP = {
  width: 268,
  fontSize: 22,
  maxLines: 8,
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
  ...PERSONAL_BODY_TOP,
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
} as const;

const PERSONAL_ACTIONS_BASE = {
  width: 240,
  fontSize: 17,
  lineHeight: 26,
  maxCharsPerLine: 13,
  maxLines: 4,
} as const;

/** @deprecated v1。action 文字数検証用 */
export const DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS = [
  {
    body: { x: 100, y: 232, ...PERSONAL_BODY_TOP },
    color: { x: 575, y: 272, width: 228, fontSize: 27, align: "middle" as const },
    actions: { x: 450, y: 362, ...PERSONAL_ACTIONS_BASE },
  },
  {
    body: { x: 100, y: 255, ...PERSONAL_BODY_BOTTOM },
    color: { x: 575, y: 280, width: 228, fontSize: 27, align: "middle" as const },
    actions: { x: 450, y: 370, ...PERSONAL_ACTIONS_BASE },
  },
] as const;

/** @deprecated v1 */
export function dailyNumberPersonalBlockLayout(blockIndex: number) {
  return DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[blockIndex] ?? DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[0];
}

export const DAILY_NUMBER_TEXT_COLOR = "#4a3728";

/** レイアウト定規用サンプル文案 */
export const DAILY_NUMBER_LAYOUT_SAMPLE = {
  todayNumber: "8",
  body: "今日の「8」の空気は、あなたの始める力にやさしい受け取り方を添えてくれそうです。",
  colorName: "赤",
} as const;
