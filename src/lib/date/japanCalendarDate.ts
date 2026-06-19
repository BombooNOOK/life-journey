const TZ_JAPAN = "Asia/Tokyo";

/** 日本時間の暦日 YYYY-MM-DD */
export function calendarDayKeyInJapanFromDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ_JAPAN });
}

/** 日本時間の「今日」を、日記記録日と同じ UTC 正午アンカー Date で返す */
export function japanTodayAnchorDate(now = new Date()): Date {
  const [y, m, d] = calendarDayKeyInJapanFromDate(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
