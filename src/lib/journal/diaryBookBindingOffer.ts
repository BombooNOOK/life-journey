import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import {
  getBookPlan,
  type BookPlanId,
  type BookPlanResult,
} from "@/lib/order/bookBindingPlan";

import { buildBoundDiaryBookPages } from "./diaryBookPages";

/** bookReader / 製本PDF 相当の完成形ページ数 */
export function countBoundDiaryBookTotalPages(
  entries: BoundDiaryEntry[],
  startDate: string,
  endDate: string,
): number {
  return buildBoundDiaryBookPages(entries, startDate, endDate).length;
}

const SHELF_PLAN_LABELS: Record<Exclude<BookPlanId, "over_limit">, string> = {
  trial: "お試し製本版",
  light: "ライト版",
  standard: "スタンダード版",
  full_year: "まるごと1年製本版",
};

export const DIARY_BOOK_BINDING_CONSULTATION_MESSAGE =
  "ページ数が多いため、個別相談が必要です";

/** 概要パネル用「製本対象：…」の値部分 */
export function diaryBookBindingOverviewValue(plan: BookPlanResult): string {
  if (plan.plan === "over_limit") {
    return DIARY_BOOK_BINDING_CONSULTATION_MESSAGE;
  }
  return `${SHELF_PLAN_LABELS[plan.plan]}（${plan.maxPages}ページまで）`;
}

export function resolveDiaryBookBindingOffer(
  entries: BoundDiaryEntry[],
  startDate: string,
  endDate: string,
): {
  totalPages: number;
  plan: BookPlanResult;
  overviewBindingValue: string;
} {
  const totalPages = countBoundDiaryBookTotalPages(entries, startDate, endDate);
  const plan = getBookPlan(totalPages);
  return {
    totalPages,
    plan,
    overviewBindingValue: diaryBookBindingOverviewValue(plan),
  };
}
