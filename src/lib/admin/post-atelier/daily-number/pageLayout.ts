import type { DailyNumberLifePathValue } from "./types";

/** カルーセル個別ページの「あなたのすうじ」ペア（1-indexed ページ番号は pageIndex + 1） */
export const DAILY_NUMBER_PERSONAL_PAGE_GROUPS: readonly (readonly DailyNumberLifePathValue[])[] =
  [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 11],
    [22, 33],
  ] as const;

export const DAILY_NUMBER_SERIES_TITLE = "あなたのすうじで読む 今日のこころ予報";

/** v1: 固定データが入っている todayNumber */
export const DAILY_NUMBER_DATA_READY_TODAY_NUMBER = 8 as const;
