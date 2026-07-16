/** どんぐり台帳の reason（内部名） */
export const DONGURI_REASONS = [
  "daily_delivery",
  "admin_grant",
  "diary_save",
  "book_create",
  "reward_ad",
  "subscription_delivery",
  "adjustment",
] as const;

export type DonguriReason = (typeof DONGURI_REASONS)[number];

export type DonguriCreatedBy = "system" | "admin" | "user";

/** ユーザー向け表示ラベル */
export const DONGURI_REASON_LABELS: Record<DonguriReason, string> = {
  daily_delivery: "ヤギさん郵便",
  admin_grant: "森からのおとどけ",
  diary_save: "日記を本棚に保存",
  book_create: "日記ブックを作成",
  reward_ad: "スポンサー上映",
  subscription_delivery: "森の定期便",
  adjustment: "調整",
};

export function donguriReasonLabel(reason: string): string {
  if (reason in DONGURI_REASON_LABELS) {
    return DONGURI_REASON_LABELS[reason as DonguriReason];
  }
  return reason;
}

export const DONGURI_PAGE_PATH = "/orders/donguri" as const;

export const DONGURI_DAILY_DELIVERY_TITLE = "ヤギさん郵便" as const;
export const DONGURI_DAILY_DELIVERY_DESCRIPTION = "今日のおとどけ" as const;

export const DONGURI_DAILY_MAIL_TITLE = "今日のおとどけ" as const;
export const DONGURI_DAILY_MAIL_PREVIEW = "どんぐりが1こ届きました。" as const;
export const DONGURI_DAILY_MAIL_BODY = [
  "今日もログハウスに来てくれてありがとう。",
  "ヤギさん郵便から、どんぐりを1こお届けしました。",
  "",
  "森での時間が、やさしい1日につながりますように。",
].join("\n");

export const DONGURI_ADMIN_GRANT_TITLE = "森からのおとどけ" as const;

/** クライアントでも使える表示用型・ヘルパー（DBアクセスなし） */

export type DonguriLedgerKind = "delivery" | "spend";

export type DonguriLedgerEntryView = {
  id: string;
  kind: DonguriLedgerKind;
  label: string;
  reason: string;
  title: string;
  description: string | null;
  delta: number;
  dateKey: string | null;
  relatedNoticeId: string | null;
  createdBy: string;
  createdAt: string;
};

export type DonguriChoView = {
  balance: number;
  todayDelivery: { label: string; delta: number } | null;
  recent: DonguriLedgerEntryView[];
};

export type DonguriAdminLedgerRow = DonguriLedgerEntryView;

export function formatDonguriDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

/** プレビュー／フォールバック用の空どんぐり帳 */
export function getStubDonguriChoView(): DonguriChoView {
  return {
    balance: 0,
    todayDelivery: null,
    recent: [],
  };
}
