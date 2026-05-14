/**
 * 日記の記録日は API で `Date.UTC(y, m - 1, d, 12, 0, 0)` として保存される。
 * 数秘・読み解きでは「その暦日」をブラウザ／サーバーのローカル TZ に依存せず取り出す。
 */
export function journalReferenceUtcYMD(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}
