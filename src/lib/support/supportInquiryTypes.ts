export const SUPPORT_INQUIRY_CATEGORIES = [
  "profile_deletion",
  "backup_restore",
  "book_binding",
  "kantei",
  "bug_display",
  "other",
] as const;

export type SupportInquiryCategory = (typeof SUPPORT_INQUIRY_CATEGORIES)[number];

export const SUPPORT_INQUIRY_CATEGORY_LABELS: Record<SupportInquiryCategory, string> = {
  profile_deletion: "プロフィール削除について",
  backup_restore: "バックアップ・復元について",
  book_binding: "製本申込について",
  kantei: "鑑定書について",
  bug_display: "不具合・表示崩れについて",
  other: "その他",
};

export const SUPPORT_INQUIRY_STATUSES = ["pending", "in_progress", "resolved", "closed"] as const;

export type SupportInquiryStatus = (typeof SUPPORT_INQUIRY_STATUSES)[number];

export const SUPPORT_INQUIRY_STATUS_LABELS: Record<SupportInquiryStatus, string> = {
  pending: "未対応",
  in_progress: "対応中",
  resolved: "対応済み",
  closed: "クローズ",
};

export const SUPPORT_INQUIRY_MESSAGE_MIN_LENGTH = 1;
export const SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH = 4000;

export function isSupportInquiryCategory(value: string): value is SupportInquiryCategory {
  return (SUPPORT_INQUIRY_CATEGORIES as readonly string[]).includes(value);
}

export function isSupportInquiryStatus(value: string): value is SupportInquiryStatus {
  return (SUPPORT_INQUIRY_STATUSES as readonly string[]).includes(value);
}

export function truncateSupportInquiryMessagePreview(message: string, maxLength = 80): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}
