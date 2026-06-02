import {
  DIARY_BOOK_BINDING_STATUSES,
  DIARY_BOOK_BINDING_STATUS_LABELS,
  type DiaryBookBindingStatus,
} from "@/lib/commerce/diaryBookBindingStatus";

/** 発送済み・キャンセル以外（未完了） */
export const BOOK_BINDING_OPEN_STATUSES = [
  "pending",
  "ordered",
  "in_production",
] as const satisfies readonly DiaryBookBindingStatus[];

export type BookBindingAdminFilter =
  | "all"
  | "open"
  | "shipped"
  | "cancelled"
  | DiaryBookBindingStatus;

export const BOOK_BINDING_ADMIN_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "all", label: "すべて" },
  { value: "open", label: "対応中（未発送・未キャンセル）" },
  ...DIARY_BOOK_BINDING_STATUSES.map((status) => ({
    value: status,
    label: DIARY_BOOK_BINDING_STATUS_LABELS[status],
  })),
];

export function normalizeBookBindingStatusFilter(filter: string): string {
  const f = filter.trim();
  return f || "all";
}

export function isBookBindingStatusFilterActive(current: string, target: string): boolean {
  return normalizeBookBindingStatusFilter(current) === target;
}

export function bookBindingAdminFilterHref(
  pathname: string,
  params: { status?: string; q?: string },
): string {
  const search = new URLSearchParams();
  const status = normalizeBookBindingStatusFilter(params.status ?? "");
  if (status !== "all") search.set("status", status);
  if (params.q?.trim()) search.set("q", params.q.trim());
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function bookBindingStatusFilterLabel(filter: string): string | null {
  const f = normalizeBookBindingStatusFilter(filter);
  if (f === "all") return null;
  if (f === "open") return "対応中（申込予定・決済確認済み・製本手配中）";
  if (f in DIARY_BOOK_BINDING_STATUS_LABELS) {
    return DIARY_BOOK_BINDING_STATUS_LABELS[f as DiaryBookBindingStatus];
  }
  return null;
}

/** 一覧の status 条件（旧URLの個別ステータスも受け付ける） */
export function bookBindingStatusWhereClause(
  filter: string,
): { status?: string | { in: string[] } } {
  const f = filter.trim();
  if (!f || f === "all") return {};
  if (f === "open") return { status: { in: [...BOOK_BINDING_OPEN_STATUSES] as string[] } };
  if (f === "shipped" || f === "cancelled") return { status: f };
  if ((DIARY_BOOK_BINDING_STATUSES as readonly string[]).includes(f)) {
    return { status: f };
  }
  return {};
}

export type BookBindingStatusCountRow = {
  status: DiaryBookBindingStatus;
  label: string;
  count: number;
};

export function mapStatusCounts(
  groups: Array<{ status: string; _count: { id: number } }>,
): BookBindingStatusCountRow[] {
  const byStatus = new Map(groups.map((g) => [g.status, g._count.id]));
  return DIARY_BOOK_BINDING_STATUSES.map((status) => ({
    status,
    label: DIARY_BOOK_BINDING_STATUS_LABELS[status],
    count: byStatus.get(status) ?? 0,
  }));
}

export function openStatusTotal(counts: BookBindingStatusCountRow[]): number {
  return counts
    .filter((c) => (BOOK_BINDING_OPEN_STATUSES as readonly string[]).includes(c.status))
    .reduce((sum, c) => sum + c.count, 0);
}
