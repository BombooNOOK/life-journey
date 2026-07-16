const MEMBER_NUMBER_DIGITS = 5;

/** 管理者一覧向け: 1 → "00001"（クライアント可） */
export function formatAccountMemberNumber(n: number): string {
  if (!Number.isFinite(n) || n < 1) return "—";
  return String(Math.trunc(n)).padStart(MEMBER_NUMBER_DIGITS, "0");
}
