/** BASE 管理画面の商品名としてそのまま使える表記（アプリ UI は略称も使用） */
export const BINDING_PRODUCT_NAMES = {
  trial: "Life Journey Diary｜お試し版（〜30ページ）",
  light: "Life Journey Diary｜ライト版（〜80ページ）",
  standard: "Life Journey Diary｜スタンダード版（〜120ページ）",
  extra20: "追加ページ（＋20ページ）",
} as const;

/** BASE 商品説明文（管理画面ペースト用・アプリでは一部のみ引用） */
export const BINDING_PRODUCT_DESCRIPTION_JA =
  "この商品は、アプリ内で作成された日記を製本するサービスです。ページ数に応じて最適なプランが自動で選択されます。※ページ数はご注文時の内容で確定します※120ページを超える場合は、追加ページをご購入ください";

/**
 * 製本 BASE ショップの商品 URL（`.env.local` で本番 URL に差し替え）。
 * NEXT_PUBLIC_* はクライアントにも渡すためブラウザで参照されます。
 */
export const TRIAL_URL =
  process.env.NEXT_PUBLIC_BASE_BOOK_TRIAL_URL ?? "https://xxxx.base.shop/items/111";

export const LIGHT_URL =
  process.env.NEXT_PUBLIC_BASE_BOOK_LIGHT_URL ?? "https://xxxx.base.shop/items/222";

export const STANDARD_URL =
  process.env.NEXT_PUBLIC_BASE_BOOK_STANDARD_URL ?? "https://xxxx.base.shop/items/333";

export const EXTRA_URL =
  process.env.NEXT_PUBLIC_BASE_BOOK_EXTRA_URL ?? "https://xxxx.base.shop/items/444";

export type BookPlanId = "trial" | "light" | "standard" | "standard_plus";

export type BookPlanResult = {
  plan: BookPlanId;
  label: string;
  baseUrl: string;
  /** standard_plus のとき追加ページ単位数（20ページ単位の切り上げ）。それ以外は 0 */
  extra: number;
};

export function getBookPlan(pageCount: number): BookPlanResult {
  const n = Math.max(0, Math.floor(Number(pageCount)) || 0);

  if (n <= 30) {
    return { plan: "trial", label: "お試し版", baseUrl: TRIAL_URL, extra: 0 };
  }
  if (n <= 80) {
    return { plan: "light", label: "ライト版", baseUrl: LIGHT_URL, extra: 0 };
  }
  if (n <= 120) {
    return { plan: "standard", label: "スタンダード版", baseUrl: STANDARD_URL, extra: 0 };
  }

  const extraPages = n - 120;
  const extraUnits = Math.ceil(extraPages / 20);

  return {
    plan: "standard_plus",
    label: "スタンダード＋追加ページ",
    baseUrl: STANDARD_URL,
    extra: extraUnits,
  };
}
