/** 管理者ユーザー一覧のアルファベット箱・ソート・絞り込み用（クライアント可） */

export const ADMIN_EMAIL_ALPHABET = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "#",
] as const;

export type AdminEmailAlphabetBucket = (typeof ADMIN_EMAIL_ALPHABET)[number];

export type AdminListSortDir = "asc" | "desc";

export type AdminDirectoryPlanFilter = "all" | "free" | "light";
export type AdminDirectoryPresenceFilter = "all" | "yes" | "no";
export type AdminDirectoryAudienceFilter = "all" | "customers" | "monitor" | "admin";

/** 管理者一覧 → 個別送信へ渡す宛先の sessionStorage キー */
export const ADMIN_FOREST_NOTICE_EMAILS_STORAGE_KEY = "lj_admin_forest_notice_emails";

/** メール先頭1文字 → A–Z または # */
export function emailAlphabetBucket(email: string): AdminEmailAlphabetBucket {
  const ch = email.trim().charAt(0).toUpperCase();
  if (ch >= "A" && ch <= "Z") return ch as AdminEmailAlphabetBucket;
  return "#";
}

export type AdminDirectorySortable = {
  memberNumber: number | null;
  registeredAt: string | null;
  email: string;
};

export type AdminDirectoryFilterable = AdminDirectorySortable & {
  subscriberPdfAccess: boolean;
  sourceOrderCount: number;
  sourceJournalCount: number;
  isAdmin: boolean;
  isMonitor: boolean;
  profileIds: string[];
};

export type AdminDirectoryFilters = {
  plan: AdminDirectoryPlanFilter;
  hasKantei: AdminDirectoryPresenceFilter;
  hasJournal: AdminDirectoryPresenceFilter;
  audience: AdminDirectoryAudienceFilter;
  /** プロフィールがあり送信可能な行だけ */
  sendableOnly: boolean;
};

export const DEFAULT_ADMIN_DIRECTORY_FILTERS: AdminDirectoryFilters = {
  plan: "all",
  hasKantei: "all",
  hasJournal: "all",
  audience: "all",
  sendableOnly: false,
};

export function compareAdminDirectoryRows(
  a: AdminDirectorySortable,
  b: AdminDirectorySortable,
  dir: AdminListSortDir,
): number {
  const sign = dir === "asc" ? 1 : -1;
  const aNum = a.memberNumber;
  const bNum = b.memberNumber;
  if (aNum != null && bNum != null && aNum !== bNum) {
    return (aNum - bNum) * sign;
  }
  if (aNum != null && bNum == null) return -1 * sign;
  if (aNum == null && bNum != null) return 1 * sign;

  const aAt = a.registeredAt ? Date.parse(a.registeredAt) : NaN;
  const bAt = b.registeredAt ? Date.parse(b.registeredAt) : NaN;
  if (Number.isFinite(aAt) && Number.isFinite(bAt) && aAt !== bAt) {
    return (aAt - bAt) * sign;
  }
  if (Number.isFinite(aAt) && !Number.isFinite(bAt)) return -1 * sign;
  if (!Number.isFinite(aAt) && Number.isFinite(bAt)) return 1 * sign;

  return a.email.localeCompare(b.email) * sign;
}

export function matchesAdminDirectoryFilters(
  row: AdminDirectoryFilterable,
  filters: AdminDirectoryFilters,
): boolean {
  if (filters.plan === "free" && row.subscriberPdfAccess) return false;
  if (filters.plan === "light" && !row.subscriberPdfAccess) return false;

  if (filters.hasKantei === "yes" && row.sourceOrderCount <= 0) return false;
  if (filters.hasKantei === "no" && row.sourceOrderCount > 0) return false;

  if (filters.hasJournal === "yes" && row.sourceJournalCount <= 0) return false;
  if (filters.hasJournal === "no" && row.sourceJournalCount > 0) return false;

  if (filters.audience === "customers" && (row.isAdmin || row.isMonitor)) return false;
  if (filters.audience === "monitor" && !row.isMonitor) return false;
  if (filters.audience === "admin" && !row.isAdmin) return false;

  if (filters.sendableOnly && row.profileIds.length === 0) return false;

  return true;
}

/** 表示中の行からランダムに最大 n 件のメールを選ぶ（重複なし） */
export function pickRandomEmails<T extends { email: string }>(rows: T[], n: number): string[] {
  const count = Math.max(0, Math.min(Math.trunc(n), rows.length));
  if (count === 0) return [];
  const pool = [...rows];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, count).map((r) => r.email);
}
