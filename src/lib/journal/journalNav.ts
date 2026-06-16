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
