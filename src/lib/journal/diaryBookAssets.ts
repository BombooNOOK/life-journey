import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";

const DIARY_BOOK_IMAGE_CACHE_VERSION = "9";

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

/** 月索引カレンダー・記録日マーク（PDF用・小さな足跡） */
export function diaryBookCalendarFootprintImagePath(): string {
  return withCache("/images/diary-book-calendar-footprint.png");
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

/** 裏表紙直前（全員必須・724×1024） */
export function diaryBookPreBackCoverIllustrationImagePath(): string {
  return withCache("/images/diary-book-binding-adjustment-illustration.png");
}

/**
 * 日記ブック本文テンプレ（金枠なし・キャラ別）。
 * 未配置キャラはフクロウ（drfukuro）にフォールバック。
 */
/** `public/images/diary-book-body-plain-*.png` が置いてある slug */
const DIARY_BOOK_BODY_TEMPLATE_AVAILABLE = new Set(["drfukuro"]);

export function diaryBookBodyTemplatePathForCompanion(companionType: string): string {
  const slug = companionTypeToTemplateSlug(companionType);
  const resolved = DIARY_BOOK_BODY_TEMPLATE_AVAILABLE.has(slug) ? slug : "drfukuro";
  return withCache(`/images/diary-book-body-plain-${resolved}.png`);
}

/** 日記ブック本文の写真枠・読み込み中プレースホルダー */
export function diaryBookPhotoMemoryLoadingImagePath(): string {
  return withCache("/images/memory-loading-owl.png");
}
