/** 有料プランの請求・解約に関するユーザー向け案内（Stripe 月額サブスク） */

export const SUBSCRIPTION_BILLING_SUMMARY = [
  "有料プランは、加入日から1ヶ月ごとに自動更新されます。",
  "解約申込後も、すでにお支払い済みの期間の終了日まではご利用いただけます。",
  "次回更新日以降の自動請求は行われません。",
  "日割りでの返金は行っておりません。",
] as const;

export const SUBSCRIPTION_CANCEL_PENDING_BILLING_NOTE =
  "この日付以降、自動請求はありません。";

export const SUBSCRIPTION_CANCEL_COMPLETE_NOTE =
  "次回更新日以降の自動請求は行われません。表示された利用期限までは、引き続きご利用いただけます。";
