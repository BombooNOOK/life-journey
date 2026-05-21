/**
 * 日記製本プラン（ページ数は includeInBook=true の JournalEntry 件数のみ。表紙・カレンダー等は含めない）
 */

/** 製本可能な日記本文ページの上限 */
export const DIARY_BINDING_MAX_PAGES = 400;

/** BASE 管理画面の商品名としてそのまま使える表記 */
export const BINDING_PRODUCT_NAMES = {
  trial: "Life Journey Diary お試し製本版",
  light: "Life Journey Diary ライト製本版",
  standard: "Life Journey Diary スタンダード製本版",
  full_year: "Life Journey Diary まるごと1年製本版",
} as const;

/** BASE 商品説明文（管理画面ペースト用・アプリでは一部のみ引用） */
export const BINDING_PRODUCT_DESCRIPTION_JA =
  "この商品は、アプリ内で作成された日記を製本するサービスです。製本に含める日記本文のページ数に応じてプランが自動選択されます。※1回の日記投稿を1ページとして数えます。※表紙・カレンダー・振り返り等はページ数に含みません。※ページ数はご注文時の内容で確定します。";

export const DIARY_BOOK_TRIAL_URL =
  process.env.NEXT_PUBLIC_DIARY_BOOK_TRIAL_URL ??
  process.env.NEXT_PUBLIC_BASE_BOOK_TRIAL_URL ??
  "https://bamboonook.base.shop/items/144971389";

export const DIARY_BOOK_LIGHT_URL =
  process.env.NEXT_PUBLIC_DIARY_BOOK_LIGHT_URL ??
  process.env.NEXT_PUBLIC_BASE_BOOK_LIGHT_URL ??
  "https://bamboonook.base.shop/items/144984479";

export const DIARY_BOOK_STANDARD_URL =
  process.env.NEXT_PUBLIC_DIARY_BOOK_STANDARD_URL ??
  process.env.NEXT_PUBLIC_BASE_BOOK_STANDARD_URL ??
  "https://bamboonook.base.shop/items/144985541";

export const DIARY_BOOK_FULL_YEAR_URL =
  process.env.NEXT_PUBLIC_DIARY_BOOK_FULL_YEAR_URL ??
  "https://bamboonook.base.shop/items/144984751";

/** @deprecated 旧名。DIARY_BOOK_TRIAL_URL を使用 */
export const TRIAL_URL = DIARY_BOOK_TRIAL_URL;
/** @deprecated */
export const LIGHT_URL = DIARY_BOOK_LIGHT_URL;
/** @deprecated */
export const STANDARD_URL = DIARY_BOOK_STANDARD_URL;

export type BookPlanId = "trial" | "light" | "standard" | "full_year" | "over_limit";

export type BookPlanResult = {
  plan: BookPlanId;
  /** UI用の短いプラン名 */
  label: string;
  /** 正式商品名 */
  productName: string;
  minPages: number;
  maxPages: number;
  priceYen: number;
  priceDisplay: string;
  /** 例: 約3ヶ月分 */
  periodHint: string | null;
  /** 例: リリース記念価格の注記 */
  priceNote: string | null;
  baseUrl: string | null;
  orderable: boolean;
  overLimitMessage: string | null;
};

export const DIARY_BINDING_OVER_LIMIT_MESSAGE =
  "製本可能ページ数を超えています。掲載する日記を400ページ以内に調整してください。";

export const BOOK_PLAN_LABELS_JA: Record<BookPlanId, string> = {
  trial: "お試し製本版",
  light: "ライト製本版",
  standard: "スタンダード製本版",
  full_year: "まるごと1年製本版",
  over_limit: "対象外（400ページ超）",
};

function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円（税込・送料込）`;
}

export function getBookPlan(pageCount: number): BookPlanResult {
  const n = Math.max(0, Math.floor(Number(pageCount)) || 0);

  if (n > DIARY_BINDING_MAX_PAGES) {
    return {
      plan: "over_limit",
      label: BOOK_PLAN_LABELS_JA.over_limit,
      productName: "—",
      minPages: DIARY_BINDING_MAX_PAGES + 1,
      maxPages: DIARY_BINDING_MAX_PAGES,
      priceYen: 0,
      priceDisplay: "—",
      periodHint: null,
      priceNote: null,
      baseUrl: null,
      orderable: false,
      overLimitMessage: DIARY_BINDING_OVER_LIMIT_MESSAGE,
    };
  }

  if (n <= 50) {
    return {
      plan: "trial",
      label: BOOK_PLAN_LABELS_JA.trial,
      productName: BINDING_PRODUCT_NAMES.trial,
      minPages: 1,
      maxPages: 50,
      priceYen: 1980,
      priceDisplay: formatYen(1980),
      periodHint: null,
      priceNote: "※リリース記念価格（通常予定価格：2,480円）",
      baseUrl: DIARY_BOOK_TRIAL_URL,
      orderable: n > 0,
      overLimitMessage: null,
    };
  }

  if (n <= 100) {
    return {
      plan: "light",
      label: BOOK_PLAN_LABELS_JA.light,
      productName: BINDING_PRODUCT_NAMES.light,
      minPages: 51,
      maxPages: 100,
      priceYen: 2980,
      priceDisplay: formatYen(2980),
      periodHint: "約3ヶ月分",
      priceNote: null,
      baseUrl: DIARY_BOOK_LIGHT_URL,
      orderable: true,
      overLimitMessage: null,
    };
  }

  if (n <= 200) {
    return {
      plan: "standard",
      label: BOOK_PLAN_LABELS_JA.standard,
      productName: BINDING_PRODUCT_NAMES.standard,
      minPages: 101,
      maxPages: 200,
      priceYen: 4980,
      priceDisplay: formatYen(4980),
      periodHint: "約半年分",
      priceNote: null,
      baseUrl: DIARY_BOOK_STANDARD_URL,
      orderable: true,
      overLimitMessage: null,
    };
  }

  return {
    plan: "full_year",
    label: BOOK_PLAN_LABELS_JA.full_year,
    productName: BINDING_PRODUCT_NAMES.full_year,
    minPages: 201,
    maxPages: 400,
    priceYen: 7980,
    priceDisplay: formatYen(7980),
    periodHint: "約1年分",
    priceNote: null,
    baseUrl: DIARY_BOOK_FULL_YEAR_URL,
    orderable: true,
    overLimitMessage: null,
  };
}
