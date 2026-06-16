import { normalizeDiaryDesignTheme } from "@/lib/journal/meta";

/** 日本時間の暦日（YYYY-MM-DD） */
export function calendarDayKeyInJapan(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

export function calendarDayKeyFromParts(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function entryDayKeyInJapan(createdAt: string): string {
  return calendarDayKeyInJapan(new Date(createdAt));
}

/** `YYYY-MM`（カレンダー month クエリ用） */
export function parseMonthKeyParam(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  const probe = new Date(year, month - 1, 1);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1) return null;
  return `${m[1]}-${m[2]}`;
}

export function monthAnchorFromMonthKey(monthKey: string): Date {
  const parsed = parseMonthKeyParam(monthKey);
  if (!parsed) return new Date();
  const [y, m] = parsed.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** 記録日（日本時間）から `YYYY-MM` */
export function entryMonthKeyFromCreatedAt(createdAt: string): string {
  return entryDayKeyInJapan(createdAt).slice(0, 7);
}

export function journalCalendarPathForMonth(monthKey: string): string {
  const parsed = parseMonthKeyParam(monthKey);
  const key = parsed ?? monthKey.trim();
  return `/orders/calendar?month=${encodeURIComponent(key)}`;
}

/** `Date`（月の1日）から `YYYY-MM` */
export function monthKeyFromDateAnchor(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 日本時間の「今月」の1日 */
export function currentMonthAnchorInJapan(): Date {
  const [y, m] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })
    .split("-")
    .map(Number);
  return new Date(y, m - 1, 1);
}

/** 日記一覧の年選択の下限（API の年フィルタと揃える） */
export const JOURNAL_LIST_MIN_YEAR = 1970;

export function currentYearInJapan(): number {
  return currentMonthAnchorInJapan().getFullYear();
}

/** 日記一覧の年プルダウン用（新しい年が上） */
export function journalListYearOptions(maxYear: number = currentYearInJapan()): number[] {
  const years: number[] = [];
  for (let y = maxYear; y >= JOURNAL_LIST_MIN_YEAR; y -= 1) {
    years.push(y);
  }
  return years;
}

/** 日記一覧の月プルダウン用（1〜12月） */
export function journalListMonthOptions(): Array<{ value: number; label: string }> {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month, label: `${month}月` };
  });
}

export function monthAnchorFromYearMonth(year: number, monthOneBased: number): Date {
  return new Date(year, monthOneBased - 1, 1);
}

export function shiftMonthAnchor(anchor: Date, deltaMonths: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + deltaMonths, 1);
}

export function journalListPathForMonth(monthKey: string): string {
  const parsed = parseMonthKeyParam(monthKey);
  const key = parsed ?? monthKey.trim();
  return `/orders/list?month=${encodeURIComponent(key)}`;
}

/** 記録の createdAt または YYYY-MM-DD からカレンダー month キーを得る */
export function resolveJournalEntryMonthKey(params: {
  createdAt?: string | null;
  entryDateYmd?: string | null;
}): string | null {
  if (params.createdAt?.trim()) {
    return entryMonthKeyFromCreatedAt(params.createdAt.trim());
  }
  const ymd = params.entryDateYmd?.trim() ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return parseMonthKeyParam(ymd.slice(0, 7));
  }
  return null;
}

export function journalPreviewPath(
  entryId: string,
  designTheme: string | null | undefined,
  returnTo: string,
  profileId?: string,
): string {
  const theme = normalizeDiaryDesignTheme(designTheme ?? "simple_plain");
  const qs = new URLSearchParams({
    entry: entryId,
    theme,
    pv: "3",
    returnTo,
  });
  if (profileId?.trim()) qs.set("profile", profileId.trim());
  return `/journal/preview?${qs.toString()}`;
}

export function journalEditPath(
  entryId: string,
  returnTo: string,
  profileId?: string,
): string {
  const qs = new URLSearchParams({
    edit: entryId,
    returnTo,
  });
  if (profileId?.trim()) qs.set("profile", profileId.trim());
  return `/journal?${qs.toString()}`;
}

export function journalNewEntryPath(
  dateYmd: string,
  returnTo: string,
  profileId?: string,
): string {
  const qs = new URLSearchParams({
    date: dateYmd,
    returnTo,
  });
  if (profileId?.trim()) qs.set("profile", profileId.trim());
  return `/journal?${qs.toString()}`;
}
