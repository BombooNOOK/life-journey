import {
  DEFAULT_CONTENT_FONT_MODE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";
import {
  DIARY_PREVIEW_LARGE_BODY_REGION,
  type DiaryPreviewRegionBox,
} from "@/lib/journal/diaryDesignPreviewTiers";

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

/** 本文枠（large・従来 TEMPLATE_LAYOUT 準拠） */
export const DIARY_PREVIEW_BODY_REGION: DiaryPreviewRegionBox = {
  ...DIARY_PREVIEW_LARGE_BODY_REGION,
};

/**
 * フクロウ欄（top 79.2% + height 19.8% ≒ 99% でページ内に収める）
 */
export const DIARY_PREVIEW_COMMENT_REGION: DiaryPreviewRegionBox = {
  left: "9.15%",
  top: "79.2%",
  width: "58%",
  heightPct: "19.8%",
};

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
  photoLeft: "52.15%",
  photoTop: "19.85%",
  photoWidth: "27.2%",
} as const;

export const DIARY_PREVIEW_OVERLAY_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';

/** DiaryPreviewFixedPage の本文・コメント内側と同一（製本確認ではスクロールバーを出さない） */
export const DIARY_PREVIEW_SCROLL_INNER_CLASS =
  [
    "m-0 box-border h-full min-h-0 overflow-y-auto overscroll-y-contain whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
    "touch-pan-y [-webkit-overflow-scrolling:touch]",
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  ].join(" ");

/** 本文のみ：行配列描画用（製本プレビュー・スクロールなし・二次折り返しなし） */
export const DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS =
  [
    "m-0 box-border block w-full max-w-full overflow-hidden",
    "whitespace-normal [overflow-wrap:normal] [word-break:normal]",
  ].join(" ");

/** @deprecated 製本プレビューでは DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS を使用 */
export const DIARY_PREVIEW_BODY_LINES_SCROLL_INNER_CLASS = DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS;

/** 今日の気分（丸枠内・数字の中心よりわずかに下） */
export const DIARY_PREVIEW_MOOD_EMOJI = {
  boxPx: 28,
  fontSizePx: 16,
  /** 数字の -50%,-50% より下寄せ（絵文字のベースライン補正） */
  transform: "translate(-50%, -44%)",
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
export function getDiaryPreviewBodySafeScrollHeightPx(): number {
  const body = regionBoxToPx(DIARY_PREVIEW_BODY_REGION);
  const comment = regionBoxToPx(DIARY_PREVIEW_COMMENT_REGION);
  return Math.max(0, Math.floor(comment.top - body.top));
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

/** フクロウ先生の読み解き（ゆったり行間・やや小さめで枠内に収めやすく） */
export const DIARY_PREVIEW_COMMENT_TEXT_STYLE = {
  fontSize: `${clampCqwCqh(12, 2.12, 1.68, 15, true)}px`,
  lineHeight: "1.62",
  letterSpacing: "0.03em",
} as const;

/** 吹き出し内側の余白（プレビュー・overflow 測定で共通） */
export const DIARY_PREVIEW_COMMENT_INNER_PADDING = "6px 12px 10px 10px";

export const DIARY_PREVIEW_DATE_ROW_STYLE = {
  fontSize: `${clampCqwCqh(10.5, 1.52, 2.08, 13, false)}px`,
  lineHeight: "1",
  letterSpacing: "0",
  weekLetterSpacing: "0",
} as const;

/**
 * 気分「回答欄」内側の表示スロット（724×1024 テンプレ PNG から算出）。
 * layout.activityTop（47.75%）は旧・小さい字の上寄せ基準で、枠内中央とは一致しない。
 */
export const DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_TOP_PX = 440;
export const DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX = 94;

/** 回答欄テキストの縦位置微調整（transform。724px 固定ページ上の px） */
export const DIARY_PREVIEW_ACTIVITY_ANSWER_NUDGE_Y_PX = 0;

/** 全モード共通：標準本文と同じサイズ（行間は枠内の見た目中央用にやや詰める） */
export function getFixedPreviewActivityTextStyle(): {
  fontSize: string;
  lineHeight: string;
} {
  const body = getFixedPreviewBodyTextStyle("standard");
  return { fontSize: body.fontSize, lineHeight: "1.25" };
}

export const DIARY_PREVIEW_NUMBER_STYLE = {
  fontSize: `${clampCqwCqh(11, 2.08, 1.55, 15, true)}px`,
  centerNudge: "translate(-50%, -50%) translate(-0.85px, -1.15px)",
} as const;

/** 日付行：スロット中央寄せ（控えめ） */
export const DIARY_PREVIEW_DATE_ROW_NUDGE = "translateY(-0.12em)";

export function getFixedPreviewBodyBoxPx(): ReturnType<typeof regionBoxToPx> {
  return regionBoxToPx(DIARY_PREVIEW_BODY_REGION);
}
