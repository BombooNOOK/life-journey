/**
 * UTC month helpers aligned with GET /api/journal parseMonth (Date.UTC).
 * Never use LJD dateKey / Asia/Tokyo for scan month boundaries.
 */

export type UtcMonthRange = { from: Date; to: Date; monthKey: string };

/** Parse `YYYY-MM` → half-open UTC range [from, to). */
export function parseUtcMonthKey(input: string): UtcMonthRange | null {
  const m = /^(\d{4})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return {
    from,
    to,
    monthKey: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`,
  };
}

export function utcMonthKeyFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`;
}

export function addUtcMonths(monthKey: string, delta: number): string | null {
  const parsed = parseUtcMonthKey(monthKey);
  if (!parsed) return null;
  const d = new Date(
    Date.UTC(parsed.from.getUTCFullYear(), parsed.from.getUTCMonth() + delta, 1),
  );
  return utcMonthKeyFromDate(d);
}

export function compareUtcMonthKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Inclusive range of UTC month keys from `from` through `to`. */
export function utcMonthKeysInclusive(from: string, to: string): string[] {
  if (compareUtcMonthKeys(from, to) > 0) return [];
  const out: string[] = [];
  let cur: string | null = from;
  while (cur && compareUtcMonthKeys(cur, to) <= 0) {
    out.push(cur);
    cur = addUtcMonths(cur, 1);
    if (out.length > 600) break; // hard safety
  }
  return out;
}

export function previousUtcMonth(monthKey: string): string | null {
  return addUtcMonths(monthKey, -1);
}
