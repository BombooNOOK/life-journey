/**
 * Caps mirrored from `src/app/api/journal/route.ts` (GET takeLimit).
 * Do not invent cursor/updated-since — none exist.
 * Production release may need pagination (Release Blocker candidate).
 */

/** `month` + `view=list` (no search) */
export const JOURNAL_API_MONTH_TAKE_VIEW_LIST = 200 as const;

/** `month` without `view=list` (calendar / default month) */
export const JOURNAL_API_MONTH_TAKE_CALENDAR = 400 as const;

/** `year` without search */
export const JOURNAL_API_YEAR_TAKE = 500 as const;

/** Default reconciliation month scan uses calendar month semantics. */
export const DEFAULT_RECONCILIATION_MONTH_LIST_CAP =
  JOURNAL_API_MONTH_TAKE_CALENDAR;

/**
 * Completeness is unknown when returned row count meets or exceeds the
 * configured take (API may have truncated silently).
 */
export function isListCapReached(
  responseCount: number,
  configuredCap: number,
): boolean {
  return responseCount >= configuredCap;
}
