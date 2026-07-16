/** 管理者ユーザー一覧のアルファベット箱・ソート用（クライアント可） */

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
