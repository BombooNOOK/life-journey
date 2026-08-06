/**
 * あしあとの記録日は API で `Date.UTC(y, m - 1, d, 12, 0, 0)` として保存される。
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

/** DB の `createdAt`（UTC 正午の記録日）を `<input type="date">` 用 `YYYY-MM-DD` にする */
export function journalEntryDateToIsoDateInput(date: Date): string {
  const { year, month, day } = journalReferenceUtcYMD(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
