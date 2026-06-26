import {
  formatUniversalCycleBreakdown,
  universalCycleNumbersFromYMD,
  type UniversalCycleNumbers,
} from "@/lib/numerology/universalYearMonthDay";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseScheduledDateYMD(
  scheduledDate: string,
): { year: number; month: number; day: number } | null {
  const value = scheduledDate.trim();
  if (!DATE_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { year: y, month: m, day: d };
}

export function universalDayForScheduledDate(scheduledDate: string): number | null {
  const ymd = parseScheduledDateYMD(scheduledDate);
  if (!ymd) return null;
  return universalCycleNumbersFromYMD(ymd.year, ymd.month, ymd.day).universalDay;
}

export function universalCycleForScheduledDate(scheduledDate: string): UniversalCycleNumbers | null {
  const ymd = parseScheduledDateYMD(scheduledDate);
  if (!ymd) return null;
  return universalCycleNumbersFromYMD(ymd.year, ymd.month, ymd.day);
}

export function formatUniversalDayBreakdown(scheduledDate: string): string | null {
  const ymd = parseScheduledDateYMD(scheduledDate);
  if (!ymd) return null;
  return formatUniversalCycleBreakdown(ymd.year, ymd.month, ymd.day);
}
