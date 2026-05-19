export const KANTEI_BOOK_BINDING_STATUSES = [
  "pending",
  "ordered",
  "in_production",
  "shipped",
  "cancelled",
] as const;

export type KanteiBookBindingStatus = (typeof KANTEI_BOOK_BINDING_STATUSES)[number];

export const KANTEI_BOOK_BINDING_STATUS_LABELS: Record<KanteiBookBindingStatus, string> = {
  pending: "申込予定（決済未確認）",
  ordered: "決済確認済み",
  in_production: "製本手配中",
  shipped: "発送済み",
  cancelled: "キャンセル",
};

export function isKanteiBookBindingStatus(value: string): value is KanteiBookBindingStatus {
  return (KANTEI_BOOK_BINDING_STATUSES as readonly string[]).includes(value);
}
