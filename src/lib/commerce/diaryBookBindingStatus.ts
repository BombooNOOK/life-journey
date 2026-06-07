export const DIARY_BOOK_BINDING_STATUSES = [
  "pending",
  "ordered",
  "in_production",
  "shipped",
  "cancelled",
  "expired",
] as const;

export type DiaryBookBindingStatus = (typeof DIARY_BOOK_BINDING_STATUSES)[number];

export const DIARY_BOOK_BINDING_STATUS_LABELS: Record<DiaryBookBindingStatus, string> = {
  pending: "申込予定（決済未確認）",
  ordered: "決済確認済み",
  in_production: "製本手配中",
  shipped: "発送済み",
  cancelled: "取り下げ済み",
  expired: "期限切れ（未決済）",
};

export function isDiaryBookBindingStatus(value: string): value is DiaryBookBindingStatus {
  return (DIARY_BOOK_BINDING_STATUSES as readonly string[]).includes(value);
}
