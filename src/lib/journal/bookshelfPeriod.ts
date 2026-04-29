/** 本棚の製本期間（その西暦年内の開始月〜終了月）に記録日が含まれるか */
export function journalEntryInBookshelfPeriod(
  createdAt: Date | string,
  shelfYear: number,
  periodStartMonth: number,
  periodEndMonth: number,
): boolean {
  const d = new Date(createdAt);
  if (d.getFullYear() !== shelfYear) return false;
  const m = d.getMonth() + 1;
  return m >= periodStartMonth && m <= periodEndMonth;
}

export function clampMonthOrder(start: number, end: number): { start: number; end: number } {
  const s = Math.min(12, Math.max(1, Math.floor(start)));
  const e = Math.min(12, Math.max(1, Math.floor(end)));
  return s <= e ? { start: s, end: e } : { start: e, end: s };
}
