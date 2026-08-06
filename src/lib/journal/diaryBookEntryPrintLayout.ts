/**
 * あしあとブック本文ページ v2 レイアウト（724×1024 設計座標）。
 * 背景: `public/images/diary-book-body-design-{slug}.png`（フクロウ基準・キャラ込み1枚）。
 * キャラなし版は `diary-book-body-design-base.png`（将来のキャラ追加用に温存）。
 * 動的テキスト・写真は固定座標で重ねる。
 *
 * 座標出典: デザイン設計（1055×1491 → 724×1024 換算）。5キャラ共通。
 */
import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";
export const DIARY_BOOK_ENTRY_V2_DESIGN = {
  widthPx: 724,
  heightPx: 1024,
} as const;

/** 水彩 scrapbook 背景テンプレを全面に使う（旧 v2 パーツ合成は使わない） */
export const DIARY_BOOK_ENTRY_V2_USE_DESIGN_BACKGROUND = true as const;

/** 写真枠オーバーレイ PNG（テープ等）を重ねる。新テンプレは1枚完結のため off */
export const DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY = false as const;

/** キャラ込み1枚テンプレをそのまま使う（別 PNG 合成は使わない） */
export const DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY = false as const;

export const DIARY_BOOK_ENTRY_V2_COMPANION = {
  /** 将来 overlay 復帰時の表示枠（object-fit: contain・左下基準） */
  leftPx: 509,
  topPx: 726,
  widthPx: 277,
  heightPx: 295,
} as const;

/** @deprecated キャラ込み1枚テンプレ使用時は未使用 */
export const DIARY_BOOK_ENTRY_V2_COMPANION_OFFSET_BY_SLUG: Partial<
  Record<string, { leftPx?: number; topPx?: number }>
> = {};

export const DIARY_BOOK_ENTRY_V2_COLORS = {
  text: "#5F5143",
  textMuted: "#7A6245",
  header: "#6F5A42",
  numberValue: "#6B543A",
  border: "#C9B896",
  borderLight: "#D6C7A1",
  commentFill: "#FAF7F2",
  photoPlaceholder: "#F8F4EA",
} as const;

/** セクション見出し（今日のすうじ・きもちの記録など） */
export const DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX = 14;
/** マスキングテープ上の見出し（おもいでの1枚・きおくの足あと・読み解き） */
export const DIARY_BOOK_ENTRY_V2_PROMINENT_LABEL_FONT_SIZE_PX = 16;
export const DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM = 0.06;

export const DIARY_BOOK_ENTRY_V2_DATE = {
  regionLeftPx: 214,
  regionTopPx: 44,
  regionWidthPx: 381,
  regionHeightPx: 32,
  topPx: 44,
  fontSizePx: 17,
  fontWeight: 600 as const,
  letterSpacingEm: 0.05,
  segmentGapPx: 6,
  /** Klee One 等で実幅が見積もりより広い分（region 内中央揃え補正） */
  measuredWidthExtraPx: 0,
  color: DIARY_BOOK_ENTRY_V2_COLORS.header,
} as const;

export const DIARY_BOOK_ENTRY_V2_PHOTO = {
  labelText: "おもいでの1枚",
  labelLeftPx: 121,
  labelTopPx: 97,
  labelWidthPx: 240,
  labelHeightPx: 33,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_PROMINENT_LABEL_FONT_SIZE_PX,
  contentLeftPx: 133,
  contentTopPx: 123,
  contentSizePx: 263,
  contentRotateDeg: -5,
} as const;

export const DIARY_BOOK_ENTRY_V2_NUMBERS = {
  headerText: "今日のすうじ",
  headerLeftPx: 432,
  headerTopPx: 110,
  headerWidthPx: 206,
  headerFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  slotLeftPx: [456, 532, 609] as const,
  slotTopPx: 193,
  slotWidthPx: 55,
  slotHeightPx: 48,
  valueFontSizePx: 23,
  labelLeftPx: [464, 541, 618] as const,
  labelTopPx: 263,
  labelWidthPx: 38,
  labelHeightPx: 22,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  labels: ["日", "月", "年"] as const,
  keys: ["today", "month", "year"] as const,
  valueOffsetPx: { x: 0, y: 0 } as const,
} as const;

export const DIARY_BOOK_ENTRY_V2_MOOD = {
  headerText: "きもちの記録",
  headerLeftPx: 443,
  headerTopPx: 295,
  headerWidthPx: 202,
  headerFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  iconLeftPx: 427,
  iconTopPx: 354,
  iconSizePx: 54,
  textLeftPx: 505,
  textTopPx: 366,
  textWidthPx: 168,
  textHeightPx: 33,
  textFontSizePx: 14,
  textLineHeight: 1.25,
  textLetterSpacingEm: 0.04,
  textFontWeight: 500 as const,
  textMaxCharsPerLine: 12,
} as const;

export const DIARY_BOOK_ENTRY_V2_BODY = {
  labelText: "きおくの足あと",
  labelLeftPx: 60,
  labelTopPx: 464,
  labelWidthPx: 226,
  labelHeightPx: 33,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_PROMINENT_LABEL_FONT_SIZE_PX,
  contentLeftPx: 60,
  contentTopPx: 501,
  contentWidthPx: 604,
  contentHeightPx: 278,
  /** 標準モード基準（実際の描画は contentFontMode 別） */
  contentFontSizePx: 20,
  contentLineHeight: 1.75,
  /** @deprecated getDiaryBookEntryV2BodyFontLayout を使用 */
  contentMaxCharsPerLine: 30,
} as const;

export const DIARY_BOOK_ENTRY_V2_COMMENT = {
  labelLeftPx: 50,
  labelTopPx: 795,
  labelWidthPx: 268,
  labelHeightPx: 36,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_PROMINENT_LABEL_FONT_SIZE_PX,
  contentLeftPx: 60,
  contentTopPx: 854,
  /** 伴走キャラ枠（left 509）手前まで（60+449=509） */
  contentWidthPx: 449,
  /** 行末 glyph はみ出し防止（折り返し計算・描画余白・約1字分） */
  contentPaddingRightPx: 12,
  /** 15px×1.62×5行 ≒ 122px（ぎゅっと本文と同系） */
  contentHeightPx: 124,
  /** 本文「ぎゅっと」と同じ */
  contentFontSizePx: 15,
  contentLineHeight: 1.62,
  /** floor((449-12)/15) — getDiaryBookEntryV2CommentFontLayout と同期 */
  contentMaxCharsPerLine: 29,
} as const;

/** 製本標準：1・2行目を最大幅まで、3・4行目をやや狭く（29字×2 + 26字×2 + 27字） */
export const DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META = {
  /** 15px では描画幅いっぱい（29字）が上限 */
  leadLineMaxCharsPerLine: DIARY_BOOK_ENTRY_V2_COMMENT.contentMaxCharsPerLine,
  restLineMaxCharsPerLine: 26,
  lastLineMaxCharsPerLine: 27,
  leadLineCount: 2,
} as const;

/** @deprecated 旧 A案名。DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE を使用 */
export const DIARY_BOOK_ENTRY_V2_COMMENT_WIDE_LEAD_LINES =
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META;

export const DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE = [
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META.leadLineMaxCharsPerLine,
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META.leadLineMaxCharsPerLine,
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META.restLineMaxCharsPerLine,
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META.restLineMaxCharsPerLine,
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE_META.lastLineMaxCharsPerLine,
] as const;

/** @deprecated 旧 A案名。DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE を使用 */
export const DIARY_BOOK_ENTRY_V2_COMMENT_WIDE_LEAD_LINE_SCHEDULE =
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE;

/** PDF・プレビュー共通の読み解き描画オプション */
export const DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS = {
  baseFontSizePx: DIARY_BOOK_ENTRY_V2_COMMENT.contentFontSizePx,
  regionHeightPx: DIARY_BOOK_ENTRY_V2_COMMENT.contentHeightPx,
  maxCharsPerLine: DIARY_BOOK_ENTRY_V2_COMMENT.contentMaxCharsPerLine,
  maxCharsPerLineSchedule: DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE,
} as const;

/** 下部花飾りの間（ページ全幅中央） */
export const DIARY_BOOK_ENTRY_V2_FOOTER = {
  text: "Life Journey Diary",
  leftPx: 0,
  topPx: 994,
  widthPx: DIARY_BOOK_ENTRY_V2_DESIGN.widthPx,
  fontSizePx: 12,
  color: "#8A7357",
  showInDesignBackground: true,
} as const;

export function getDiaryBookEntryCompanionBox(companionType: string): {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
} {
  const cfg = DIARY_BOOK_ENTRY_V2_COMPANION;
  const slug = companionTypeToTemplateSlug(companionType);
  const offset = DIARY_BOOK_ENTRY_V2_COMPANION_OFFSET_BY_SLUG[slug] ?? {};
  return {
    leftPx: cfg.leftPx + (offset.leftPx ?? 0),
    topPx: cfg.topPx + (offset.topPx ?? 0),
    widthPx: cfg.widthPx,
    heightPx: cfg.heightPx,
  };
}

export function getDiaryBookEntryPhotoRotateOriginPx(): { xPx: number; yPx: number } {
  const photo = DIARY_BOOK_ENTRY_V2_PHOTO;
  return {
    xPx: photo.contentLeftPx + photo.contentSizePx / 2,
    yPx: photo.contentTopPx + photo.contentSizePx / 2,
  };
}

export function getDiaryBookEntryPhotoLabelRotateOriginPx(): { xPx: number; yPx: number } {
  const photo = DIARY_BOOK_ENTRY_V2_PHOTO;
  return {
    xPx: photo.labelLeftPx + photo.labelWidthPx / 2,
    yPx: photo.labelTopPx + photo.labelHeightPx / 2,
  };
}

export function estimateDiaryBookEntryDateRowWidthPx(
  segments: readonly { text: string }[],
  fontSizePx: number,
  letterSpacingEm: number,
  segmentGapPx: number,
): number {
  const letterSpacingPx = letterSpacingEm * fontSizePx;
  return segments.reduce((width, segment, index) => {
    const chars = [...segment.text];
    const segmentWidth =
      chars.length === 0
        ? 0
        : chars.length * fontSizePx + (chars.length - 1) * letterSpacingPx;
    return width + (index > 0 ? segmentGapPx : 0) + segmentWidth;
  }, 0);
}

/** 日付行を region 内で中央揃え */
export function getDiaryBookEntryDateRowLeftPx(
  segments: readonly { text: string }[],
  fontSizePx: number,
): number {
  const widthPx =
    estimateDiaryBookEntryDateRowWidthPx(
      segments,
      fontSizePx,
      DIARY_BOOK_ENTRY_V2_DATE.letterSpacingEm,
      DIARY_BOOK_ENTRY_V2_DATE.segmentGapPx,
    ) + DIARY_BOOK_ENTRY_V2_DATE.measuredWidthExtraPx;
  const centerX =
    DIARY_BOOK_ENTRY_V2_DATE.regionLeftPx + DIARY_BOOK_ENTRY_V2_DATE.regionWidthPx / 2;
  return centerX - widthPx / 2;
}

export function estimateDiaryBookEntryBodyLabelWidthPx(
  text: string,
  fontSizePx: number,
  letterSpacingEm: number,
): number {
  const letterSpacingPx = letterSpacingEm * fontSizePx;
  const chars = [...text];
  if (chars.length === 0) return 0;
  return chars.reduce(
    (width, _, index) => width + fontSizePx + (index < chars.length - 1 ? letterSpacingPx : 0),
    0,
  );
}

export function getDiaryBookEntryNumberSlotBox(index: number): {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
} {
  const cfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  return {
    leftPx: cfg.slotLeftPx[index] ?? cfg.slotLeftPx[0],
    topPx: cfg.slotTopPx,
    widthPx: cfg.slotWidthPx,
    heightPx: cfg.slotHeightPx,
  };
}

export function getDiaryBookEntryNumberLabelBox(index: number): {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
} {
  const cfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  return {
    leftPx: cfg.labelLeftPx[index] ?? cfg.labelLeftPx[0],
    topPx: cfg.labelTopPx,
    widthPx: cfg.labelWidthPx,
    heightPx: cfg.labelHeightPx,
  };
}
