import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";
import { DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY } from "@/lib/journal/diaryBookEntryPrintLayout";

const DIARY_BOOK_IMAGE_CACHE_VERSION = "23";

function withCache(path: string): string {
  return `${path}?v=${DIARY_BOOK_IMAGE_CACHE_VERSION}`;
}

/** 日記ブック共通・中表紙テンプレ（724×1024） */
export function diaryBookInsideCoverImagePath(): string {
  return withCache("/images/diary-book-inside-cover.png");
}

/** 日記ブック共通・裏表紙（724×1024） */
export function diaryBookBackCoverImagePath(): string {
  return withCache("/images/diary-book-back.png");
}

/** 日記ブック共通・月インデックス用の元背景（724×1024・参照用） */
export function diaryBookMonthIndexImagePath(): string {
  return withCache("/images/diary-book-month-index.png");
}

/** 月シルエットのみ（透明 PNG・生成り地の上に重ねる） */
export function diaryBookMonthIndexMoonImagePath(): string {
  return withCache("/images/diary-book-month-index-moon.png");
}

/** 月索引カレンダー・記録日マーク（肉球2つ・PDF/ビューワー共通） */
export function diaryBookCalendarPawprintImagePath(): string {
  return withCache("/images/diary-book-calendar-pawprint.png");
}

/** @deprecated `diaryBookCalendarPawprintImagePath` を使用 */
export function diaryBookCalendarFootprintImagePath(): string {
  return diaryBookCalendarPawprintImagePath();
}

/** 月索引の裏（全月共通・足跡・724×1024） */
export function diaryBookMonthIllustrationImagePath(): string {
  return withCache("/images/diary-book-month-illustration.png");
}

/** 中表紙裏の調整用イラスト（724×1024） */
export function diaryBookInsideCoverBackIllustrationImagePath(): string {
  return withCache("/images/diary-book-inside-cover-back-illustration.png");
}

/** 日記本文枚数の見開き調整（全月共通・724×1024） */
export function diaryBookMonthBodyOddAdjustmentIllustrationImagePath(): string {
  return withCache("/images/diary-book-month-body-odd-adjustment-illustration.png");
}

/** 自由記入欄・見開き左（724×1024） */
export function diaryBookFreeWritingLeftImagePath(): string {
  return withCache("/images/diary-book-free-writing-left.png");
}

/** 自由記入欄・見開き右（724×1024） */
export function diaryBookFreeWritingRightImagePath(): string {
  return withCache("/images/diary-book-free-writing-right.png");
}

/** 今日のすうじ 早見表（724×1024・Canva 全面） */
export function diaryBookNumerologyQuickReferenceImagePath(): string {
  return withCache("/images/diary-book-numerology-quick-reference.png");
}

/** 裏表紙直前（全員必須・724×1024） */
export function diaryBookPreBackCoverIllustrationImagePath(): string {
  return withCache("/images/diary-book-binding-adjustment-illustration.png");
}

/**
 * 日記ブック本文テンプレ（水彩 scrapbook 背景・キャラ別・724×1024）。
 * フクロウ先生基準で位置合わせ済みのキャラ込み1枚 PNG。
 * `diary-book-body-design-base.png` はキャラなし版（将来のキャラ追加用）。
 */
/** `public/images/diary-book-body-design-*.png` が置いてある slug */
const DIARY_BOOK_BODY_DESIGN_TEMPLATE_AVAILABLE = new Set([
  "drfukuro",
  "harinezumi",
  "namakemono",
  "risu",
  "kerosion",
]);

export function diaryBookBodyDesignBaseTemplatePath(): string {
  return withCache("/images/diary-book-body-design-base.png");
}

export function diaryBookBodyDesignBackgroundPathForCompanion(companionType: string): string {
  if (DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY) {
    return diaryBookBodyDesignBaseTemplatePath();
  }
  return diaryBookBodyDesignTemplatePathForCompanion(companionType);
}

export function diaryBookBodyDesignTemplatePathForCompanion(companionType: string): string {
  const slug = companionTypeToTemplateSlug(companionType);
  const resolved = DIARY_BOOK_BODY_DESIGN_TEMPLATE_AVAILABLE.has(slug) ? slug : "drfukuro";
  return withCache(`/images/diary-book-body-design-${resolved}.png`);
}

/** 本文 v2 写真枠の装飾（マスキングテープ・花・枠線）を写真の上に重ねる透明 PNG */
const DIARY_BOOK_BODY_DESIGN_PHOTO_OVERLAY_AVAILABLE = DIARY_BOOK_BODY_DESIGN_TEMPLATE_AVAILABLE;

export function diaryBookBodyDesignPhotoOverlayPathForCompanion(companionType: string): string {
  const slug = companionTypeToTemplateSlug(companionType);
  const resolved = DIARY_BOOK_BODY_DESIGN_PHOTO_OVERLAY_AVAILABLE.has(slug) ? slug : "drfukuro";
  return withCache(`/images/diary-book-body-design-${resolved}-photo-overlay.png`);
}

/** @deprecated `diaryBookBodyDesignTemplatePathForCompanion` を使用 */
export function diaryBookBodyTemplatePathForCompanion(companionType: string): string {
  return diaryBookBodyDesignTemplatePathForCompanion(companionType);
}

/** 日記ブック本文の写真枠・読み込み中プレースホルダー */
export function diaryBookPhotoMemoryLoadingImagePath(): string {
  return withCache("/images/memory-loading-owl.png");
}
