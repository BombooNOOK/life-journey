/** 同一オリジン内の相対パスのみ許可（オープンリダイレクト防止） */
export function resolveSafeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/orders";
  if (!raw.startsWith("/")) return "/orders";
  if (raw.startsWith("//")) return "/orders";
  return raw;
}
