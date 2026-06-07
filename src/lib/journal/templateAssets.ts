import type { CompanionType } from "@/lib/journal/meta";
import { isCompanionType } from "@/lib/journal/meta";
import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";

/** 日記ページ背景（罫線なしのみ）。キャラ別 PNG。 */
const TEMPLATE_BASENAME = "diary-template-simple-plain";
const TEMPLATE_CACHE_VERSION = "5";

function templatePath(slug: string): string {
  return `/images/${TEMPLATE_BASENAME}-${slug}.png?v=${TEMPLATE_CACHE_VERSION}`;
}

/** 画面上のプレビュー・入力補助用 */
export function diaryTemplateScreenPathForCompanion(companionType: string): string {
  return templatePath(companionTypeToTemplateSlug(companionType));
}

/** 印刷・製本取り込み用（現状は screen と同じ PNG。高解像度版は `-print` サフィックスで追加可） */
export function diaryTemplatePrintPathForCompanion(companionType: string): string {
  return diaryTemplateScreenPathForCompanion(companionType);
}

/** @deprecated 常に罫線なし。`diaryTemplateScreenPathForCompanion` を使用 */
export const diaryTemplateScreenImageMap = {
  simple_plain: templatePath("drfukuro"),
} as const;

/** @deprecated `diaryTemplatePrintPathForCompanion` を使用 */
export const diaryTemplatePrintImageMap = {
  simple_plain: templatePath("drfukuro"),
} as const;

export function diaryTemplatePathForCompanion(companionType: string): string {
  return diaryTemplateScreenPathForCompanion(companionType);
}

export type DiaryCompanionWithTemplate = CompanionType;
