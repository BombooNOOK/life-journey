/**
 * BASE ショップ URL（アプリ導線用）。
 * 日記製本（ページ数別）は `bookBindingPlan.ts` を参照。
 */

/** ライトプラン（月額・定期便） */
export const BASE_LIGHT_SUBSCRIPTION_URL =
  process.env.NEXT_PUBLIC_BASE_LIGHT_SUBSCRIPTION_URL ??
  "https://bamboonook.base.shop/items/144880129";

/** 鑑定書 製本版（単発・2,980円） */
export const BASE_KANTEI_BOOK_URL =
  process.env.NEXT_PUBLIC_BASE_KANTEI_BOOK_URL ??
  "https://bamboonook.base.shop/items/144880008";

/** スタンダードプラン（近日公開・遷移なし） */
export const BASE_STANDARD_SUBSCRIPTION_URL =
  process.env.NEXT_PUBLIC_BASE_STANDARD_SUBSCRIPTION_URL ?? "";
