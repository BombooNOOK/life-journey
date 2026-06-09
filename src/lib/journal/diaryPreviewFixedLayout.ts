import {
  DEFAULT_CONTENT_FONT_MODE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";
import type { DiaryPreviewRegionBox } from "@/lib/journal/diaryDesignPreviewTiers";

/** 製本1ページの論理サイズ（テンプレ PNG と同一） */
export const DIARY_PREVIEW_PAGE_WIDTH = 724;
export const DIARY_PREVIEW_PAGE_HEIGHT = 1024;

/** 幅基準フィット（PC カード等）の安全係数 */
export const DIARY_PREVIEW_SAFE_SCALE_WIDTH = 0.94;

/** 縦横収めるフィット（スマホ枠・全画面）の安全係数 */
export const DIARY_PREVIEW_SAFE_SCALE_CONTAIN = 0.9;

/**
 * テンプレ PNG は 724×1024 ピッセル前提。inset で縮小しない（金枠欠け・座標ズレの原因）。
 */
export const DIARY_PREVIEW_TEMPLATE_INSET_PCT = "0";

/**
 * ページタイトル「Life Journey Diary」
 * Y は Canva A5（y 0.29cm / h 2.37cm）を 724×1024 に換算。X はページ全幅で中央揃え。
 */
export const DIARY_PREVIEW_TITLE_REGION: DiaryPreviewRegionBox = {
  left: "0%",
  top: "1.38%",
  width: "100%",
  heightPct: "11.29%",
};

export const DIARY_PREVIEW_TITLE_TEXT = "Life Journey Diary" as const;

/** 製本 PDF 用 serif（registerFonts の LibreBaskerville） */
export const DIARY_PREVIEW_TITLE_PDF_FONT = "LibreBaskerville" as const;

/** オーバーレイ座標（724×1024 基準・従来プレビューに合わせ微調整） */
export const DIARY_PREVIEW_TEMPLATE_LAYOUT = {
  dateYearLeft: "29.85%",
  dateMonthLeft: "43.9%",
  dateDayLeft: "51.45%",
  dateWeekLeft: "64.1%",
  dateTop: "12.05%",
  activityLeft: "16.95%",
  activityTop: "47.75%",
  contentLeft: "13.2%",
  contentTop: "55.65%",
  contentWidth: "72.8%",
  numberLeft: "35.62%",
  numberTodayTop: "19.2%",
  numberMonthTop: "24.6%",
  numberYearTop: "30.5%",
  numberCalmTop: "36.55%",
  /** @deprecated DIARY_PREVIEW_PHOTO_REGION を使用 */
  photoLeft: "52.49%",
  /** @deprecated DIARY_PREVIEW_PHOTO_REGION を使用 */
  photoTop: "19.53%",
  /** @deprecated DIARY_PREVIEW_PHOTO_REGION を使用 */
  photoWidth: "27.07%",
} as const;

/**
 * 写真枠（右上ボックス内・「今日の写真」ラベル下の正方形）。
 * 参考画像（sankou）を 724×1024 に合わせて計測。
 */
export const DIARY_PREVIEW_PHOTO_REGION = {
  /** 「今日の写真」行の中心（写真上端 200px より上に配置） */
  labelCenterXPx: 478,
  labelCenterYPx: 185,
  leftPx: 380,
  topPx: 200,
  sizePx: 196,
} as const;

export const DIARY_PREVIEW_PHOTO_LABEL_TEXT = "今日の写真" as const;

export const DIARY_PREVIEW_OVERLAY_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';

/** 読み解き欄：段落なし・ブラウザ/react-pdf の自然折り返し（anywhere 禁止） */
export const DIARY_PREVIEW_COMMENT_FLOW_INNER_CLASS =
  [
    "m-0 box-border h-full min-h-0 overflow-hidden",
    "whitespace-normal [overflow-wrap:normal] [word-break:normal]",
    "[line-break:strict]",
  ].join(" ");

/** DiaryPreviewFixedPage の本文・コメント内側と同一（製本確認ではスクロールバーを出さない） */
export const DIARY_PREVIEW_SCROLL_INNER_CLASS =
  [
    "m-0 box-border h-full min-h-0 overflow-y-auto overscroll-y-contain whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
    "touch-pan-y [-webkit-overflow-scrolling:touch]",
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  ].join(" ");

/** 読み解き欄：行配列描画用（横クリップなし・行末1文字欠け防止） */
export const DIARY_PREVIEW_COMMENT_LINES_INNER_CLASS =
  [
    "m-0 box-border block w-full max-w-full",
    "whitespace-normal [overflow-wrap:normal] [word-break:normal]",
  ].join(" ");

/** 本文のみ：行配列描画用（製本プレビュー・スクロールなし・二次折り返しなし） */
export const DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS =
  [
    "m-0 box-border block w-full max-w-full overflow-hidden",
    "whitespace-normal [overflow-wrap:normal] [word-break:normal]",
  ].join(" ");

/** @deprecated 製本プレビューでは DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS を使用 */
export const DIARY_PREVIEW_BODY_LINES_SCROLL_INNER_CLASS = DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS;

/** 本文以降のくすみブラウン（参考画像・Canva「テキストの色」） */
export const DIARY_PREVIEW_BODY_TEXT_COLOR = "#705b4f" as const;

/**
 * 本文欄（「今日の記録」ラベル＋本文スロット）。
 * diary-book-body-plain-drfukuro.png 走査＋参考画像（sankou）724×1024 換算。
 */
export const DIARY_PREVIEW_BODY_CONTENT_REGION = {
  labelLeftPx: 123,
  /** 羽 bbox 垂直中心 y≈550 に横並び */
  labelCenterYPx: 550,
  contentLeftPx: 96,
  contentTopPx: 590,
  contentWidthPx: 527,
} as const;

export const DIARY_PREVIEW_BODY_LABEL_TEXT = "今日の記録" as const;

export const DIARY_PREVIEW_BODY_LABEL_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontSize: "12px",
  fontWeight: 700 as const,
  lineHeight: "1",
  letterSpacing: "0.06em",
} as const;

/** ラベル行・本文スロットをまとめて上へ（724×1024 基準 px） */
export const DIARY_PREVIEW_BODY_BLOCK_NUDGE_Y_PX = -8;

/**
 * 羽アイコン中心から見出し中心までのオフセット。
 * 活動欄「今日はどんな気分でしたか？」（BLOCK_NUDGE -8px）と同じ位置関係。
 */
export const DIARY_PREVIEW_FEATHER_LABEL_OFFSET_Y_PX = -8;

/** 「今日の記録」見出しの追加微調整（基準オフセットの上にちょい下げ） */
export const DIARY_PREVIEW_BODY_LABEL_NUDGE_Y_PX = 7;

/** 本文枠（製本固定ページ・CONTENT_REGION から導出） */
export const DIARY_PREVIEW_BODY_REGION: DiaryPreviewRegionBox = {
  left: `${((DIARY_PREVIEW_BODY_CONTENT_REGION.contentLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`,
  top: `${((DIARY_PREVIEW_BODY_CONTENT_REGION.contentTopPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((DIARY_PREVIEW_BODY_CONTENT_REGION.contentWidthPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`,
  heightPct: "26%",
};

/**
 * 読み解き欄（吹き出し枠・見出し＋本文スロット）。
 * diary-book-body-plain-*.png 走査＋参考画像（sankou2）724×1024 換算。
 */
export const DIARY_PREVIEW_COMMENT_CONTENT_REGION = {
  /** 吹き出し枠（テンプレ走査・y≈760–978） */
  boxLeftPx: 85,
  boxTopPx: 760,
  boxWidthPx: 420,
  boxHeightPx: 218,
  /** 羽アイコン右の見出し行（羽 bbox 垂直中心 y≈778 に横並び） */
  labelLeftPx: 130,
  labelCenterYPx: 778,
  contentLeftPx: 121,
  contentTopPx: 805,
  /** 360→368：フクロウ画像手前まで数px広げ、15px×24字+letter-spacing の行末欠けを防ぐ */
  contentWidthPx: 368,
  contentHeightPx: 173,
} as const;

/** 「◯◯の読み解き」見出しの追加微調整（基準オフセットの上にだいぶ下げ） */
export const DIARY_PREVIEW_COMMENT_LABEL_NUDGE_Y_PX = 12;

/** 見出し（`getCompanionReadingHeading` と同じ字サイズ・太さ） */
export const DIARY_PREVIEW_COMMENT_LABEL_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontSize: "12px",
  fontWeight: 700 as const,
  lineHeight: "1",
  letterSpacing: "0.06em",
} as const;

/** フクロウ欄（製本固定ページ・CONTENT_REGION から導出） */
export const DIARY_PREVIEW_COMMENT_REGION: DiaryPreviewRegionBox = {
  left: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.boxLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`,
  top: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.boxTopPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.boxWidthPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`,
  heightPct: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.boxHeightPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`,
};

export const DIARY_PREVIEW_PHOTO_LABEL_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontSize: "12px",
  fontWeight: 700 as const,
  lineHeight: "1",
  letterSpacing: "0.06em",
} as const;

/**
 * 今日の数字・気分（左枠の行レイアウト）。
 * diary-book-body-plain-drfukuro.png 走査（白円 bbox 中心・ラベル左寄せ）。
 */
export const DIARY_PREVIEW_NUMBER_MOOD_REGION = {
  /** 丸枠中心 X（各行共通） */
  valueCenterXPx: 262,
  /** ラベル左端（点線エリア内・数字との間に適度な空き） */
  labelLeftPx: 134,
  todayCenterYPx: 200,
  monthCenterYPx: 256,
  yearCenterYPx: 314,
  moodCenterYPx: 376,
} as const;

export type DiaryPreviewNumberMoodRowKey = "today" | "month" | "year" | "mood";

export const DIARY_PREVIEW_NUMBER_MOOD_ROWS: readonly {
  key: DiaryPreviewNumberMoodRowKey;
  label: string;
  centerYPx: number;
}[] = [
  { key: "today", label: "今日の数字", centerYPx: DIARY_PREVIEW_NUMBER_MOOD_REGION.todayCenterYPx },
  { key: "month", label: "月の数字", centerYPx: DIARY_PREVIEW_NUMBER_MOOD_REGION.monthCenterYPx },
  { key: "year", label: "年の数字", centerYPx: DIARY_PREVIEW_NUMBER_MOOD_REGION.yearCenterYPx },
  { key: "mood", label: "今日の気分", centerYPx: DIARY_PREVIEW_NUMBER_MOOD_REGION.moodCenterYPx },
] as const;

export const DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontSize: "12px",
  fontWeight: 700 as const,
  lineHeight: "1",
  letterSpacing: "0.06em",
} as const;

/** 今日の気分アイコン（丸枠内） */
export const DIARY_PREVIEW_MOOD_EMOJI = {
  boxPx: 22,
  fontSizePx: 16,
} as const;

const PAGE_W = DIARY_PREVIEW_PAGE_WIDTH;
const PAGE_H = DIARY_PREVIEW_PAGE_HEIGHT;

function cqw(units: number): number {
  return (units / 100) * PAGE_W;
}

function cqh(units: number): number {
  return (units / 100) * PAGE_H;
}

function clampPx(minPx: number, midPx: number, maxPx: number): number {
  return Math.min(maxPx, Math.max(minPx, midPx));
}

/** 724×1024 固定での clamp(min, mid, max) — cqw/cqh を px に解決 */
function clampCqwCqh(
  minPx: number,
  midCqw: number,
  midCqh: number,
  maxPx: number,
  useMax = false,
): number {
  const mid = useMax ? Math.max(cqw(midCqw), cqh(midCqh)) : Math.min(cqw(midCqw), cqh(midCqh));
  return clampPx(minPx, mid, maxPx);
}

export function regionBoxToPx(region: DiaryPreviewRegionBox): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const parsePct = (v: string) => parseFloat(v) / 100;
  return {
    left: parsePct(region.left) * DIARY_PREVIEW_PAGE_WIDTH,
    top: parsePct(region.top) * DIARY_PREVIEW_PAGE_HEIGHT,
    width: parsePct(region.width) * DIARY_PREVIEW_PAGE_WIDTH,
    height: parsePct(region.heightPct) * DIARY_PREVIEW_PAGE_HEIGHT,
  };
}

/**
 * 本文枠の上端〜フクロウ欄上端までの高さ（px）。
 * 枠 heightPct（26%）の下端はコメント帯と重なるため、表示・スクロールはこちらに合わせる。
 */
export function getDiaryPreviewBodyContentTopPx(): number {
  return DIARY_PREVIEW_BODY_CONTENT_REGION.contentTopPx + DIARY_PREVIEW_BODY_BLOCK_NUDGE_Y_PX;
}

export function getDiaryPreviewBodySafeScrollHeightPx(): number {
  return Math.max(
    0,
    Math.floor(
      DIARY_PREVIEW_COMMENT_CONTENT_REGION.boxTopPx - getDiaryPreviewBodyContentTopPx(),
    ),
  );
}

/** @see getDiaryPreviewBodySafeScrollHeightPx */
export const DIARY_PREVIEW_BODY_SAFE_SCROLL_HEIGHT_PX = getDiaryPreviewBodySafeScrollHeightPx();

function bodyFontSizePx(sc: number): number {
  return clampCqwCqh(8 * sc, 2.12 * sc, 2.98 * sc, 10.25 * sc, false);
}

/** 標準＝旧ゆったり相当の見た目（1.12 × 1.375） */
const STANDARD_BODY_PREVIEW_FONT_SCALE = 1.12 * 1.375;
const STANDARD_BODY_LINE_HEIGHT = "1.575";

/** ゆったり：短文を大きめに（28字/行。字サイズは旧1.15倍→1.18倍でわずかに拡大） */
const RELAXED_BODY_PREVIEW_FONT_SCALE = STANDARD_BODY_PREVIEW_FONT_SCALE * 1.18;
const RELAXED_BODY_LINE_HEIGHT = "1.65";

/** たっぷり：やや長め・やや小さめ（~12.8px） */
const GENEROUS_BODY_PREVIEW_FONT_SCALE = 1.25;
const GENEROUS_BODY_LINE_HEIGHT = "1.55";

/** ぎゅっと：たっぷりより少し小さい（44字/行・~11.8px。旧0.76倍は小さすぎた） */
const COMPACT_BODY_PREVIEW_FONT_SCALE = 1.15;
const COMPACT_BODY_LINE_HEIGHT = "1.52";

function bodyStyleFromScale(
  scale: number,
  lineHeight: string,
): { fontSize: string; lineHeight: string } {
  return {
    fontSize: `${bodyFontSizePx(scale)}px`,
    lineHeight,
  };
}

/** 724×1024 固定での本文スタイル（px 解決済み・プレビューと測定で共有） */
export function getFixedPreviewBodyTextStyle(
  contentFontMode: string | null | undefined,
): { fontSize: string; lineHeight: string } {
  const mode = normalizeContentFontMode(contentFontMode ?? DEFAULT_CONTENT_FONT_MODE);

  switch (mode) {
    case "relaxed":
      return bodyStyleFromScale(RELAXED_BODY_PREVIEW_FONT_SCALE, RELAXED_BODY_LINE_HEIGHT);
    case "standard":
      return bodyStyleFromScale(STANDARD_BODY_PREVIEW_FONT_SCALE, STANDARD_BODY_LINE_HEIGHT);
    case "generous":
      return bodyStyleFromScale(GENEROUS_BODY_PREVIEW_FONT_SCALE, GENEROUS_BODY_LINE_HEIGHT);
    case "compact":
      return bodyStyleFromScale(COMPACT_BODY_PREVIEW_FONT_SCALE, COMPACT_BODY_LINE_HEIGHT);
    default:
      return bodyStyleFromScale(STANDARD_BODY_PREVIEW_FONT_SCALE, STANDARD_BODY_LINE_HEIGHT);
  }
}

/** ダークブラウン #574129（Canva「テキストの色」） */
export const DIARY_PREVIEW_TITLE_STYLE = {
  color: "#574129",
  /** 初回目安。実物PDFで微調整 */
  fontSize: `${clampCqwCqh(18, 2.8, 2.2, 26, false)}px`,
  lineHeight: 1,
  letterSpacing: "0.03em",
  fontFamily: 'ui-serif, "Libre Baskerville", Georgia, "Times New Roman", serif',
} as const;

/** 読み解き本文（ゆったり行間・やや小さめで枠内に収めやすく） */
export const DIARY_PREVIEW_COMMENT_TEXT_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontSize: `${clampCqwCqh(12, 2.12, 1.68, 15, true)}px`,
  lineHeight: "1.62",
  letterSpacing: "0.03em",
} as const;

/** 読み解き本文スロット内余白（右・下に数pxだけ逃げ。overflow:hidden は使わない） */
export const DIARY_PREVIEW_COMMENT_INNER_PADDING = "0 4px 4px 0";

export const DIARY_PREVIEW_COMMENT_INNER_PADDING_PX = {
  top: 0,
  right: 4,
  bottom: 4,
  left: 0,
} as const;

/**
 * 日付行（プレーンテンプレ・参考画像準拠）。
 * 旧の個別 left% は使わず、ページ中央の1行 flex で描画する。
 */
export const DIARY_PREVIEW_DATE_ROW_REGION = {
  /**
   * 日付直上の細い横線（diary-book-body-plain-drfukuro.png 走査）。
   * 帯 y=141–146px の上端。
   */
  lineTopPx: 141,
  /** テキスト下端と横線の間（724×1024 基準 px） */
  lineGapPx: 3,
} as const;

export const DIARY_PREVIEW_DATE_ROW_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontWeight: 700 as const,
  lineHeight: "1",
  letterSpacing: "0.08em",
  /** セグメント間（724×1024 基準 px） */
  segmentGapPx: 8,
} as const;

/** 日付行の字サイズは本文（contentFontMode）と同じ */
export function getDiaryPreviewDateRowTextStyle(
  contentFontMode?: string | null,
): { fontSize: string; lineHeight: string } {
  const body = getFixedPreviewBodyTextStyle(contentFontMode);
  return { fontSize: body.fontSize, lineHeight: DIARY_PREVIEW_DATE_ROW_STYLE.lineHeight };
}

function diaryPreviewDateRowFontPx(contentFontMode?: string | null): number {
  return parseFloat(getDiaryPreviewDateRowTextStyle(contentFontMode).fontSize);
}

/** 日付テキスト上端。下端が横線の少し上（lineGapPx 分）に来るよう算出 */
export function getDiaryPreviewDateRowTopPx(contentFontMode?: string | null): number {
  return (
    DIARY_PREVIEW_DATE_ROW_REGION.lineTopPx -
    diaryPreviewDateRowFontPx(contentFontMode) -
    DIARY_PREVIEW_DATE_ROW_REGION.lineGapPx
  );
}

export function getDiaryPreviewDateRowTopPct(contentFontMode?: string | null): string {
  return `${((getDiaryPreviewDateRowTopPx(contentFontMode) / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

const DIARY_PREVIEW_DATE_WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type DiaryPreviewDateRowSegment = {
  key: string;
  text: string;
};

/** `日付 2026 年 6 月 5 日 ( 金 )` のセグメント列 */
export function getDiaryPreviewDateRowSegments(date: Date): readonly DiaryPreviewDateRowSegment[] {
  const weekday = DIARY_PREVIEW_DATE_WEEKDAY_LABELS[date.getDay()] ?? "";
  return [
    { key: "label", text: "日付" },
    { key: "year", text: String(date.getFullYear()) },
    { key: "年", text: "年" },
    { key: "month", text: String(date.getMonth() + 1) },
    { key: "月", text: "月" },
    { key: "day", text: String(date.getDate()) },
    { key: "日", text: "日" },
    { key: "open", text: "(" },
    { key: "week", text: weekday },
    { key: "close", text: ")" },
  ] as const;
}

/**
 * 今日の過ごし方（中段ピル枠・質問ラベル＋回答スロット）。
 * diary-book-body-plain-drfukuro.png 走査＋参考画像（sankou）724×1024 換算。
 */
export const DIARY_PREVIEW_ACTIVITY_REGION = {
  /** 羽アイコン右の質問行左端 */
  questionLabelLeftPx: 123,
  /** 質問行の垂直中心（羽 bbox 垂直中心 y≈445 に横並び） */
  questionCenterYPx: 445,
  answerLeftPx: 123,
  /** ピル内区切り線（y≈458）直下 */
  answerSlotTopPx: 463,
  answerSlotHeightPx: 48,
  answerWidthPx: 469,
} as const;

/** 製本テンプレ参考画像の文言（アプリ入力UIとは異なる） */
export const DIARY_PREVIEW_ACTIVITY_QUESTION_TEXT = "今日はどんな気分でしたか？" as const;

export const DIARY_PREVIEW_ACTIVITY_LABEL_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontSize: "12px",
  fontWeight: 700 as const,
  lineHeight: "1",
  letterSpacing: "0.06em",
} as const;

/** 質問行・回答欄をまとめて上へ（724×1024 基準 px。羽見出しオフセットと同値） */
export const DIARY_PREVIEW_ACTIVITY_BLOCK_NUDGE_Y_PX = DIARY_PREVIEW_FEATHER_LABEL_OFFSET_Y_PX;

/** @deprecated DIARY_PREVIEW_ACTIVITY_REGION.answerSlotTopPx を使用 */
export const DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_TOP_PX =
  DIARY_PREVIEW_ACTIVITY_REGION.answerSlotTopPx;

/** @deprecated DIARY_PREVIEW_ACTIVITY_REGION.answerSlotHeightPx を使用 */
export const DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX =
  DIARY_PREVIEW_ACTIVITY_REGION.answerSlotHeightPx;

/** 回答欄スロット内テキストのみの縦微調整（724×1024 基準 px。スロット枠は動かさない） */
export const DIARY_PREVIEW_ACTIVITY_ANSWER_TEXT_NUDGE_Y_PX = 4;

/** 全モード共通：標準本文と同じサイズ（行間は枠内の見た目中央用にやや詰める） */
export function getFixedPreviewActivityTextStyle(): {
  fontSize: string;
  lineHeight: string;
} {
  const body = getFixedPreviewBodyTextStyle("standard");
  return { fontSize: body.fontSize, lineHeight: "1.25" };
}

export const DIARY_PREVIEW_NUMBER_STYLE = {
  color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  fontWeight: 700 as const,
  /** 今日・月・年の数字を丸枠中心に揃える（724×1024 基準 px） */
  slotWidthPx: 32,
  slotHeightPx: 27,
} as const;

/** 丸内の数字（本文よりやや小さめで枠内中央に収める） */
export function getDiaryPreviewNumberTextStyle(
  contentFontMode?: string | null,
): { fontSize: string; lineHeight: string } {
  const body = getFixedPreviewBodyTextStyle(contentFontMode);
  const px = Math.round(parseFloat(body.fontSize) * 0.88);
  return { fontSize: `${px}px`, lineHeight: "1" };
}

export function getDiaryPreviewNumberMoodValueCenterXPx(): number {
  return DIARY_PREVIEW_NUMBER_MOOD_REGION.valueCenterXPx;
}

export function getDiaryPreviewNumberMoodValueCenterXPct(): string {
  return `${((DIARY_PREVIEW_NUMBER_MOOD_REGION.valueCenterXPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewNumberMoodLabelLeftPx(): number {
  return DIARY_PREVIEW_NUMBER_MOOD_REGION.labelLeftPx;
}

export function getDiaryPreviewNumberMoodLabelLeftPct(): string {
  return `${((DIARY_PREVIEW_NUMBER_MOOD_REGION.labelLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewNumberSlotCenterYPx(
  slot: "today" | "month" | "year",
): number {
  const row = DIARY_PREVIEW_NUMBER_MOOD_ROWS.find((r) => r.key === slot);
  return row?.centerYPx ?? DIARY_PREVIEW_NUMBER_MOOD_REGION.todayCenterYPx;
}

export function getDiaryPreviewNumberSlotCenterYPct(
  slot: "today" | "month" | "year",
): string {
  const y = getDiaryPreviewNumberSlotCenterYPx(slot);
  return `${((y / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewMoodSlotCenterYPx(): number {
  return DIARY_PREVIEW_NUMBER_MOOD_REGION.moodCenterYPx;
}

export function getDiaryPreviewMoodSlotCenterYPct(): string {
  return `${((getDiaryPreviewMoodSlotCenterYPx() / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewNumberMoodRowCenterYPct(key: DiaryPreviewNumberMoodRowKey): string {
  const row = DIARY_PREVIEW_NUMBER_MOOD_ROWS.find((r) => r.key === key);
  const y = row?.centerYPx ?? DIARY_PREVIEW_NUMBER_MOOD_REGION.todayCenterYPx;
  return `${((y / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewPhotoLeftPct(): string {
  return `${((DIARY_PREVIEW_PHOTO_REGION.leftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewPhotoTopPct(): string {
  return `${((DIARY_PREVIEW_PHOTO_REGION.topPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewPhotoWidthPct(): string {
  return `${((DIARY_PREVIEW_PHOTO_REGION.sizePx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewPhotoLabelCenterXPct(): string {
  return `${((DIARY_PREVIEW_PHOTO_REGION.labelCenterXPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewPhotoLabelCenterYPct(): string {
  return `${((DIARY_PREVIEW_PHOTO_REGION.labelCenterYPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewActivityQuestionLabelLeftPx(): number {
  return DIARY_PREVIEW_ACTIVITY_REGION.questionLabelLeftPx;
}

export function getDiaryPreviewActivityQuestionLabelLeftPct(): string {
  return `${((DIARY_PREVIEW_ACTIVITY_REGION.questionLabelLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewActivityQuestionCenterYPx(): number {
  return (
    DIARY_PREVIEW_ACTIVITY_REGION.questionCenterYPx + DIARY_PREVIEW_ACTIVITY_BLOCK_NUDGE_Y_PX
  );
}

export function getDiaryPreviewActivityQuestionCenterYPct(): string {
  return `${((getDiaryPreviewActivityQuestionCenterYPx() / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewActivityAnswerSlotTopPx(): number {
  return DIARY_PREVIEW_ACTIVITY_REGION.answerSlotTopPx + DIARY_PREVIEW_ACTIVITY_BLOCK_NUDGE_Y_PX;
}

export function getDiaryPreviewActivityAnswerLeftPct(): string {
  return `${((DIARY_PREVIEW_ACTIVITY_REGION.answerLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewActivityAnswerWidthPct(): string {
  return `${((DIARY_PREVIEW_ACTIVITY_REGION.answerWidthPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getFixedPreviewBodyBoxPx(): ReturnType<typeof regionBoxToPx> {
  return {
    left: DIARY_PREVIEW_BODY_CONTENT_REGION.contentLeftPx,
    top: getDiaryPreviewBodyContentTopPx(),
    width: DIARY_PREVIEW_BODY_CONTENT_REGION.contentWidthPx,
    height: getDiaryPreviewBodySafeScrollHeightPx(),
  };
}

export function getDiaryPreviewBodyContentRegionBox(): DiaryPreviewRegionBox {
  return {
    left: DIARY_PREVIEW_BODY_REGION.left,
    top: `${((getDiaryPreviewBodyContentTopPx() / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`,
    width: DIARY_PREVIEW_BODY_REGION.width,
    heightPct: DIARY_PREVIEW_BODY_REGION.heightPct,
  };
}

export function getDiaryPreviewBodyLabelLeftPct(): string {
  return `${((DIARY_PREVIEW_BODY_CONTENT_REGION.labelLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewBodyLabelCenterYPct(): string {
  return `${((getDiaryPreviewBodyLabelCenterYPx() / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewBodyLabelLeftPx(): number {
  return DIARY_PREVIEW_BODY_CONTENT_REGION.labelLeftPx;
}

export function getDiaryPreviewBodyLabelCenterYPx(): number {
  return (
    DIARY_PREVIEW_BODY_CONTENT_REGION.labelCenterYPx +
    DIARY_PREVIEW_FEATHER_LABEL_OFFSET_Y_PX +
    DIARY_PREVIEW_BODY_LABEL_NUDGE_Y_PX
  );
}

export function getDiaryPreviewBodyContentWidthPx(): number {
  return DIARY_PREVIEW_BODY_CONTENT_REGION.contentWidthPx;
}

export function getDiaryPreviewCommentLabelLeftPct(): string {
  return `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.labelLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewCommentLabelCenterYPct(): string {
  return `${((getDiaryPreviewCommentLabelCenterYPx() / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`;
}

export function getDiaryPreviewCommentLabelLeftPx(): number {
  return DIARY_PREVIEW_COMMENT_CONTENT_REGION.labelLeftPx;
}

export function getDiaryPreviewCommentLabelCenterYPx(): number {
  return (
    DIARY_PREVIEW_COMMENT_CONTENT_REGION.labelCenterYPx +
    DIARY_PREVIEW_FEATHER_LABEL_OFFSET_Y_PX +
    DIARY_PREVIEW_COMMENT_LABEL_NUDGE_Y_PX
  );
}

export function getDiaryPreviewCommentContentRegionBox(): DiaryPreviewRegionBox {
  return {
    left: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentLeftPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`,
    top: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentTopPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`,
    width: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentWidthPx / DIARY_PREVIEW_PAGE_WIDTH) * 100).toFixed(2)}%`,
    heightPct: `${((DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentHeightPx / DIARY_PREVIEW_PAGE_HEIGHT) * 100).toFixed(2)}%`,
  };
}

export function getFixedPreviewCommentBoxPx(): ReturnType<typeof regionBoxToPx> {
  return {
    left: DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentLeftPx,
    top: DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentTopPx,
    width: DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentWidthPx,
    height: DIARY_PREVIEW_COMMENT_CONTENT_REGION.contentHeightPx,
  };
}
