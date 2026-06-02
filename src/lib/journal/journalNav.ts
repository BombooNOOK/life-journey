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

export function journalPreviewPath(
  entryId: string,
  designTheme: string | null | undefined,
  returnTo: string,
): string {
  const theme = normalizeDiaryDesignTheme(designTheme ?? "simple_plain");
  const qs = new URLSearchParams({
    entry: entryId,
    theme,
    pv: "3",
    returnTo,
  });
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
