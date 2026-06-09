export const FREE_TRIAL_DAYS = 14;
export const FREE_TRIAL_WARNING_START_DAY = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 開始当日を 1 日目とする */
export function trialDayIndex(startedAt: Date, now: Date): number {
  const elapsed = now.getTime() - startedAt.getTime();
  return Math.floor(elapsed / MS_PER_DAY) + 1;
}

export function isWithinTrial(startedAt: Date, now: Date): boolean {
  return trialDayIndex(startedAt, now) <= FREE_TRIAL_DAYS;
}

export function trialDaysRemaining(startedAt: Date, now: Date): number {
  const dayIndex = trialDayIndex(startedAt, now);
  return Math.max(0, FREE_TRIAL_DAYS - dayIndex + 1);
}
