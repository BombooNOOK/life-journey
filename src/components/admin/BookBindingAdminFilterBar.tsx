import Link from "next/link";

import {
  BOOK_BINDING_ADMIN_FILTER_OPTIONS,
  bookBindingAdminFilterHref,
  bookBindingStatusFilterLabel,
  isBookBindingStatusFilterActive,
  type BookBindingStatusCountRow,
} from "@/lib/commerce/bookBindingAdminFilter";

type FilterOption = { value: string; label: string };

type Props = {
  basePath: string;
  statusFilter: string;
  keyword: string;
  statusCounts: BookBindingStatusCountRow[];
  openTotal: number;
  searchPlaceholder: string;
  filterOptions?: ReadonlyArray<FilterOption>;
  getFilterHref?: typeof bookBindingAdminFilterHref;
  getStatusFilterLabel?: typeof bookBindingStatusFilterLabel;
  isStatusFilterActive?: typeof isBookBindingStatusFilterActive;
};

function countBadgeClass(active: boolean, variant: "open" | "shipped" | "cancelled" | "default") {
  const base =
    "inline-flex items-center rounded-md border px-2.5 py-1 text-sm transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-1";
  if (active) {
    return `${base} border-stone-800 bg-stone-800 text-white shadow-sm ring-2 ring-stone-400 ring-offset-1`;
  }
  if (variant === "shipped") {
    return `${base} border-stone-200 bg-white text-stone-800 hover:border-stone-300`;
  }
  if (variant === "cancelled") {
    return `${base} border-stone-200 bg-stone-100 text-stone-600 hover:border-stone-300`;
  }
  if (variant === "open") {
    return `${base} border-amber-400 bg-amber-100 font-medium text-amber-950 hover:border-amber-500`;
  }
  return `${base} border-amber-200 bg-amber-50/90 text-amber-950 hover:border-amber-300`;
}

export function BookBindingAdminFilterBar({
  basePath,
  statusFilter,
  keyword,
  statusCounts,
  openTotal,
  searchPlaceholder,
  filterOptions = BOOK_BINDING_ADMIN_FILTER_OPTIONS,
  getFilterHref = bookBindingAdminFilterHref,
  getStatusFilterLabel = bookBindingStatusFilterLabel,
  isStatusFilterActive = isBookBindingStatusFilterActive,
}: Props) {
  const activeLabel = getStatusFilterLabel(statusFilter);

  return (
    <>
      <section className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
        <p className="text-xs font-medium text-stone-600">
          ステータス別件数（全体）— クリックで絞り込み
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {statusCounts.map((row) => {
            const active = isStatusFilterActive(statusFilter, row.status);
            const variant =
              row.status === "shipped"
                ? "shipped"
                : row.status === "cancelled"
                  ? "cancelled"
                  : "default";
            return (
              <li key={row.status}>
                <Link
                  href={getFilterHref(basePath, {
                    status: row.status,
                    q: keyword,
                  })}
                  aria-current={active ? "true" : undefined}
                  className={countBadgeClass(active, variant)}
                >
                  {row.label}：
                  <span className="ml-0.5 font-semibold tabular-nums">{row.count}</span>件
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href={getFilterHref(basePath, { status: "open", q: keyword })}
              aria-current={isStatusFilterActive(statusFilter, "open") ? "true" : undefined}
              className={countBadgeClass(
                isStatusFilterActive(statusFilter, "open"),
                "open",
              )}
            >
              対応中 合計：
              <span className="ml-0.5 font-semibold tabular-nums">{openTotal}</span>件
            </Link>
          </li>
        </ul>
      </section>

      <form method="get" action={basePath} className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-stone-600">{searchPlaceholder}</span>
          <input
            name="q"
            defaultValue={keyword}
            className="mt-1 block w-64 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-600">ステータス</span>
          <select
            name="status"
            defaultValue={statusFilter || "all"}
            className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          絞り込み
        </button>
        {statusFilter && statusFilter !== "all" ? (
          <Link
            href={getFilterHref(basePath, { status: "all", q: keyword })}
            className="text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
          >
            絞り込みを解除
          </Link>
        ) : null}
      </form>

      {activeLabel ? (
        <p className="text-xs text-amber-900">
          表示中：<span className="font-medium">{activeLabel}</span>
          {statusFilter === "open" ? (
            <span className="text-stone-600">
              {" "}
              （申込予定・決済確認済み・製本手配中。発送済み・キャンセルは含みません）
            </span>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
