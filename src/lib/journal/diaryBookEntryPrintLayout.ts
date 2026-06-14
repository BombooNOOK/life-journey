/**
 * 日記ブック本文ページ v2 レイアウト（724×1024 設計座標）。
 * docs/reference/diary-book-entry-sample-filled.png を基準。
 * 背景なし・枠線はコード・装飾は PNG パーツ。
 */
export const DIARY_BOOK_ENTRY_V2_DESIGN = {
  widthPx: 724,
  heightPx: 1024,
} as const;

export const DIARY_BOOK_ENTRY_V2_COLORS = {
  text: "#5E544B",
  textMuted: "#7A6F63",
  border: "#C9B896",
  borderLight: "#D6C7A1",
  commentFill: "#FAF7F2",
  photoPlaceholder: "#F8F4EA",
} as const;

/** 従来テンプレ（DIARY_PREVIEW_*_LABEL_STYLE）と同じ見出しサイズ */
export const DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX = 12;
export const DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM = 0.06;

export const DIARY_BOOK_ENTRY_V2_DATE = {
  topPx: 38,
  fontWeight: 700 as const,
  /** 従来 DIARY_PREVIEW_DATE_ROW_STYLE と同じ */
  letterSpacingEm: 0.08,
  segmentGapPx: 8,
  color: DIARY_BOOK_ENTRY_V2_COLORS.text,
  branchTopPx: 37,
  /** 日付テキスト幅に足す装飾線の余白（左右合計） */
  branchExtraWidthPx: 36,
  /** diary-book-entry-deco-branch.png（1024×256）の幅/高さ */
  branchAspectRatio: 4,
} as const;

export function estimateDiaryBookEntryDateRowWidthPx(
  segments: readonly { text: string }[],
  fontSizePx: number,
  letterSpacingEm: number,
  segmentGapPx: number,
): number {
  const letterSpacingPx = letterSpacingEm * fontSizePx;
  return segments.reduce((width, segment, index) => {
    const segmentWidth = [...segment.text].reduce(
      (sum) => sum + fontSizePx + letterSpacingPx,
      0,
    );
    return width + (index > 0 ? segmentGapPx : 0) + segmentWidth;
  }, 0);
}

export const DIARY_BOOK_ENTRY_V2_PHOTO = {
  leftPx: 48,
  topPx: 108,
  sizePx: 292,
  labelText: "おもいでの1枚",
  labelTopPx: 98,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  /** 葉枠 PNG 内側の写真エリア（292px 枠・走査値） */
  photoInnerInsetLeftPx: 33,
  photoInnerInsetTopPx: 27,
  photoInnerSizePx: 228,
  /** 写真なし時のカメラシルエット（枠サイズに対する比率） */
  cameraIconScale: 0.28,
  /** 内側正方形に対する写真サイズ */
  photoContentScale: 0.8,
} as const;

export const DIARY_BOOK_ENTRY_V2_NUMBERS = {
  leftPx: 392,
  topPx: 98,
  widthPx: 284,
  headerText: "今日のすうじ",
  headerFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  branchWidthPx: 148,
  branchHeightPx: 36,
  branchTopPx: 106,
  /** 装飾線の直下から数字アイコン行まで */
  rowGapBelowBranchPx: 8,
  rowTopPx: 144,
  slotSizePx: 72,
  slotGapPx: 18,
  /** スロットごとの背景アイコンサイズ（省略時は slotSizePx） */
  slotBgSizePxByKey: {
    day: 80,
    month: 76,
    year: 96,
  } as const,
  valueFontSizePx: 22,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  /** 切り株スロット基準の数字位置（全スロット共通） */
  valueOffsetPx: { x: 0, y: -2 } as const,
  labels: ["日", "月", "年"] as const,
  keys: ["today", "month", "year"] as const,
} as const;

export const DIARY_BOOK_ENTRY_V2_MOOD = {
  leftPx: 392,
  topPx: 270,
  widthPx: 284,
  headerText: "きもちの記録",
  headerFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  branchTopPx: 280,
  iconSizePx: 48,
  iconLeftPx: 380,
  iconTopPx: 319,
  textLeftPx: 438,
  textTopPx: 329,
  textWidthPx: 232,
  textFontSizePx: 13,
  textLineHeight: 1.3,
  textLetterSpacingEm: 0.04,
  /** 最長ラベル（17字）を1行に収める */
  textMaxCharsPerLine: 20,
} as const;

export const DIARY_BOOK_ENTRY_V2_BODY = {
  labelText: "きおくの足あと",
  /** 本文・フクロウ見出し（contentLeftPx: 64）と左揃え */
  labelLeftPx: 64,
  labelTopPx: 404,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  featherSizePx: 22,
  /** 見出し直前（labelLeft 64 − 羽幅 22 − 余白 2） */
  featherLeftPx: 40,
  featherTopPx: 398,
  boxLeftPx: 48,
  boxTopPx: 428,
  boxWidthPx: 628,
  /** 下端をフクロウ欄上端（780）より32px上に */
  boxHeightPx: 320,
  boxBorderRadiusPx: 12,
  boxBorderWidthPx: 1.2,
  contentLeftPx: 64,
  contentTopPx: 444,
  contentWidthPx: 596,
  contentHeightPx: 288,
  /** 標準モード近似（実際の描画は contentFontMode 別） */
  contentFontSizePx: 20.1,
  contentLineHeight: 1.8,
  /** @deprecated getDiaryBookEntryV2BodyFontLayout を使用 */
  contentMaxCharsPerLine: 29,
  pawprintAfterTitle: {
    widthPx: 18,
    heightPx: 18,
    gapAfterTitlePx: 6,
    topNudgePx: 3,
  },
} as const;

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

export const DIARY_BOOK_ENTRY_V2_COMMENT = {
  labelText: "フクロウ先生の読み解き",
  /** 本文左端と揃える（羽アイコンなし） */
  labelLeftPx: 64,
  /** パネル内ヘッダー（panelTop + 14） */
  labelTopPx: 794,
  labelFontSizePx: DIARY_BOOK_ENTRY_V2_LABEL_FONT_SIZE_PX,
  panelLeftPx: 48,
  panelTopPx: 780,
  panelWidthPx: 628,
  panelHeightPx: 170,
  panelBorderRadiusPx: 10,
  panelFill: DIARY_BOOK_ENTRY_V2_COLORS.commentFill,
  contentLeftPx: 64,
  /** 見出し下に余白（labelTop 794 + 12px 見出し + 20px） */
  contentTopPx: 826,
  /** フクロウイラスト手前まで（724 - 18 - 160 - 64 - 4） */
  contentWidthPx: 478,
  /** 5行分（15px × 1.62 × 5 ≒ 122px）＋わずかな余白 */
  contentHeightPx: 125,
  contentFontSizePx: 15,
  contentLineHeight: 1.62,
  /**
   * 1行あたりの文字数（478px ÷ 15px ≒ 31字。字数優先・括弧引き戻しのみ）。
   * PDF・本棚プレビュー共通。
   */
  contentMaxCharsPerLine: 31,
  companionWidthPx: 160,
  companionHeightPx: 170,
  /** ページ右端からの余白 */
  companionRightPx: 18,
  /** フッター直上（978 - 170 - 28） */
  companionTopPx: 780,
} as const;

export const DIARY_BOOK_ENTRY_V2_FOOTER = {
  text: "Life Journey Diary",
  topPx: 978,
  fontSizePx: 11,
  color: "#574129",
} as const;
