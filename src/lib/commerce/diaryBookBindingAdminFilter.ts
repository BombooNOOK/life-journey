import type { Prisma } from "@prisma/client";

import {
  DIARY_BOOK_BINDING_STATUSES,
  DIARY_BOOK_BINDING_STATUS_LABELS,
  type DiaryBookBindingStatus,
} from "@/lib/commerce/diaryBookBindingStatus";
import { visibleUnpaidPendingWhere } from "@/lib/commerce/diaryBookBindingPendingLifecycle";

/** 発送済み・キャンセル・期限切れ以外（未完了） */
export const DIARY_BOOK_BINDING_OPEN_STATUSES = [
  "pending",
  "ordered",
  "in_production",
] as const satisfies readonly DiaryBookBindingStatus[];

export type DiaryBookBindingAdminFilter =
  | "all"
  | "open"
  | "shipped"
  | DiaryBookBindingStatus;

export const DIARY_BOOK_BINDING_ADMIN_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "all", label: "すべて（通常表示）" },
  { value: "open", label: "対応中（未発送・未キャンセル）" },
  ...DIARY_BOOK_BINDING_STATUSES.map((status) => ({
    value: status,
    label: DIARY_BOOK_BINDING_STATUS_LABELS[status],
  })),
];

export function normalizeDiaryBookBindingStatusFilter(filter: string): string {
  const f = filter.trim();
  return f || "all";
}

export function isDiaryBookBindingStatusFilterActive(current: string, target: string): boolean {
  return normalizeDiaryBookBindingStatusFilter(current) === target;
}

export function diaryBookBindingAdminFilterHref(
  pathname: string,
  params: { status?: string; q?: string },
): string {
  const search = new URLSearchParams();
  const status = normalizeDiaryBookBindingStatusFilter(params.status ?? "");
  if (status !== "all") search.set("status", status);
  if (params.q?.trim()) search.set("q", params.q.trim());
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function diaryBookBindingStatusFilterLabel(filter: string): string | null {
  const f = normalizeDiaryBookBindingStatusFilter(filter);
  if (f === "all") return null;
  if (f === "open") return "対応中（申込予定・決済確認済み・製本手配中）";
  if (f in DIARY_BOOK_BINDING_STATUS_LABELS) {
    return DIARY_BOOK_BINDING_STATUS_LABELS[f as DiaryBookBindingStatus];
  }
  return null;
}

/** 通常一覧: 期限切れ・キャンセル済み・古い未決済 pending は非表示 */
export function diaryBookBindingStatusWhereClause(
  filter: string,
  now = new Date(),
): Prisma.DiaryBookBindingRequestWhereInput {
  const f = filter.trim();

  if (!f || f === "all") {
    return {
      OR: [
        { status: { in: ["ordered", "in_production", "shipped"] } },
        visibleUnpaidPendingWhere(now),
      ],
    };
  }

  if (f === "open") {
    return {
      OR: [{ status: { in: ["ordered", "in_production"] } }, visibleUnpaidPendingWhere(now)],
    };
  }

  if (f === "pending") {
    return visibleUnpaidPendingWhere(now);
  }

  if ((DIARY_BOOK_BINDING_STATUSES as readonly string[]).includes(f)) {
    return { status: f };
  }

  return {};
}

export type DiaryBookBindingStatusCountRow = {
  status: DiaryBookBindingStatus;
  label: string;
  count: number;
};

export function mapDiaryBookBindingStatusCounts(
  groups: Array<{ status: string; _count: { id: number } }>,
): DiaryBookBindingStatusCountRow[] {
  const byStatus = new Map(groups.map((g) => [g.status, g._count.id]));
  return DIARY_BOOK_BINDING_STATUSES.map((status) => ({
    status,
    label: DIARY_BOOK_BINDING_STATUS_LABELS[status],
    count: byStatus.get(status) ?? 0,
  }));
}

export function diaryBookBindingOpenStatusTotal(counts: DiaryBookBindingStatusCountRow[]): number {
  return counts
    .filter((c) => (DIARY_BOOK_BINDING_OPEN_STATUSES as readonly string[]).includes(c.status))
    .reduce((sum, c) => sum + c.count, 0);
}
