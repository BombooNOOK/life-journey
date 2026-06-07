import Link from "next/link";
import { notFound } from "next/navigation";

import { BookBindingAdminFilterBar } from "@/components/admin/BookBindingAdminFilterBar";
import { DiaryBookBindingPrintDownload } from "@/components/admin/DiaryBookBindingPrintDownload";
import {
  updateDiaryBookBindingRequest,
  withdrawDiaryBookBindingRequest,
} from "@/app/admin/diary-book-binding/actions";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import {
  diaryBookBindingStatusWhereClause,
  mapDiaryBookBindingStatusCounts,
  diaryBookBindingOpenStatusTotal,
  DIARY_BOOK_BINDING_ADMIN_FILTER_OPTIONS,
  diaryBookBindingAdminFilterHref,
  diaryBookBindingStatusFilterLabel,
  isDiaryBookBindingStatusFilterActive,
} from "@/lib/commerce/diaryBookBindingAdminFilter";
import {
  canAdminWithdrawPending,
  expireStaleUnpaidPendingRequests,
} from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import {
  DIARY_BOOK_BINDING_STATUSES,
  DIARY_BOOK_BINDING_STATUS_LABELS,
} from "@/lib/commerce/diaryBookBindingStatus";
import { BOOK_PLAN_LABELS_JA, type BookPlanId } from "@/lib/order/bookBindingPlan";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

function planLabel(planId: string): string {
  if (planId in BOOK_PLAN_LABELS_JA) {
    return BOOK_PLAN_LABELS_JA[planId as BookPlanId];
  }
  return planId;
}

export default async function AdminDiaryBookBindingPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) notFound();

  const { q = "", status: statusFilter = "" } = await searchParams;
  const keyword = q.trim();

  await expireStaleUnpaidPendingRequests();

  const statusClause = diaryBookBindingStatusWhereClause(statusFilter);

  const where: {
    AND?: Array<Record<string, unknown>>;
    OR?: Array<
      | { email: { contains: string; mode: "insensitive" } }
      | { diaryBindingCode: { contains: string; mode: "insensitive" } }
      | { diaryBookId: { contains: string; mode: "insensitive" } }
      | { displayTitle: { contains: string; mode: "insensitive" } }
      | { baseOrderNumber: { contains: string; mode: "insensitive" } }
    >;
  } = { AND: [statusClause] };

  if (keyword) {
    where.AND?.push({
      OR: [
        { email: { contains: keyword, mode: "insensitive" } },
        { diaryBindingCode: { contains: keyword, mode: "insensitive" } },
        { diaryBookId: { contains: keyword, mode: "insensitive" } },
        { displayTitle: { contains: keyword, mode: "insensitive" } },
        { baseOrderNumber: { contains: keyword, mode: "insensitive" } },
      ],
    });
  }

  const [rows, statusGroups] = await Promise.all([
    prisma.diaryBookBindingRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.diaryBookBindingRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts = mapDiaryBookBindingStatusCounts(statusGroups);
  const openTotal = diaryBookBindingOpenStatusTotal(statusCounts);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者（ユーザー一覧）
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">日記 製本申込予定</h1>
        <p className="mt-1 text-sm text-stone-600">
          日記ブック本棚または年本棚から発行された製本申込予定です。BASEの「製本申込コード」と照合し、ステータスを更新してください。
          BASE未決済の申込予定は7日経過で通常一覧から外れます（ステータス「期限切れ」で確認できます）。
        </p>
      </div>

      <BookBindingAdminFilterBar
        basePath="/admin/diary-book-binding"
        statusFilter={statusFilter}
        keyword={keyword}
        statusCounts={statusCounts}
        openTotal={openTotal}
        searchPlaceholder="検索（製本コード・メール・表示名・日記ブックID・BASE注文番号）"
        filterOptions={DIARY_BOOK_BINDING_ADMIN_FILTER_OPTIONS}
        getFilterHref={diaryBookBindingAdminFilterHref}
        getStatusFilterLabel={diaryBookBindingStatusFilterLabel}
        isStatusFilterActive={isDiaryBookBindingStatusFilterActive}
      />

      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">該当する申込予定はありません。</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-stone-500">申込日時</p>
                  <p className="text-sm font-medium text-stone-900">
                    {row.createdAt.toLocaleString("ja-JP")}
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                    {DIARY_BOOK_BINDING_STATUS_LABELS[
                      row.status as keyof typeof DIARY_BOOK_BINDING_STATUS_LABELS
                    ] ?? row.status}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold text-stone-900">{row.diaryBindingCode}</p>
              </div>

              <dl className="mt-3 grid gap-1 text-sm text-stone-700 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className="text-stone-500">種別: </span>
                  {row.diaryBookId ? (
                    <span className="font-medium text-emerald-900">日記ブック</span>
                  ) : (
                    <span className="font-medium text-stone-800">年本棚（旧）</span>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-stone-500">タイトル: </span>
                  {row.displayTitle ?? "—"}
                </div>
                {row.diaryBookId ? (
                  <>
                    <div className="sm:col-span-2">
                      <span className="text-stone-500">日記ブックID: </span>
                      <span className="font-mono text-xs">{row.diaryBookId}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-stone-500">対象期間: </span>
                      {row.startDate && row.endDate
                        ? `${row.startDate} 〜 ${row.endDate}`
                        : "—"}
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-stone-500">年: </span>
                    {row.year != null ? `${row.year}年` : "—"}
                    {row.periodStartMonth != null && row.periodEndMonth != null
                      ? `（${row.periodStartMonth}月〜${row.periodEndMonth}月）`
                      : null}
                  </div>
                )}
                <div>
                  <span className="text-stone-500">ページ数: </span>
                  {row.pageCount}
                </div>
                <div>
                  <span className="text-stone-500">プラン: </span>
                  {planLabel(row.planId)}
                  <span className="font-mono text-xs text-stone-500"> ({row.planId})</span>
                </div>
                {row.baseShopUrl ? (
                  <div className="sm:col-span-2">
                    <span className="text-stone-500">BASE商品: </span>
                    <a
                      href={row.baseShopUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-violet-800 underline-offset-2 hover:underline"
                    >
                      商品ページを開く
                    </a>
                  </div>
                ) : null}
                <div>
                  <span className="text-stone-500">メール: </span>
                  {row.email}
                </div>
                <div>
                  <span className="text-stone-500">プロフィールID: </span>
                  <span className="font-mono text-xs">{row.profileId || "—"}</span>
                </div>
              </dl>

              {row.diaryBookId ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 px-3 py-2.5">
                    <p className="text-[10px] font-medium text-emerald-950">製本内容の照合</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-stone-600">
                      申込ユーザーの日記ブックを本棚と同じ画面で確認できます（管理者 read-only）。
                    </p>
                    <a
                      href={`/orders/bookshelf/diary-book/${encodeURIComponent(row.diaryBookId)}?returnTo=${encodeURIComponent("/admin/diary-book-binding")}`}
                      className="mt-2 inline-flex text-xs font-medium text-emerald-900 underline-offset-2 hover:underline"
                    >
                      日記ブックを確認する
                    </a>
                  </div>
                  <DiaryBookBindingPrintDownload
                    requestId={row.id}
                    bindingCode={row.diaryBindingCode}
                    startDate={row.startDate}
                    endDate={row.endDate}
                    pageCount={row.pageCount}
                    baseOrderNumber={row.baseOrderNumber}
                    baseBuyerName={row.baseBuyerName}
                  />
                </div>
              ) : (
                <p className="mt-3 text-[10px] text-stone-500">
                  年本棚（旧）の申込のため、日記ブックIDがありません。該当年の本棚から確認してください。
                </p>
              )}

              {canAdminWithdrawPending(row) ? (
                <form action={withdrawDiaryBookBindingRequest} className="mt-4 border-t border-stone-100 pt-4">
                  <input type="hidden" name="id" value={row.id} />
                  <p className="text-xs text-stone-600">
                    BASE決済が確認できない申込予定は、一覧から取り下げできます（DB上はキャンセル扱いで保持します）。
                  </p>
                  <button
                    type="submit"
                    className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100"
                  >
                    申込予定を取り下げる
                  </button>
                </form>
              ) : null}

              <form
                action={updateDiaryBookBindingRequest}
                className="mt-4 space-y-3 border-t border-stone-100 pt-4"
              >
                <input type="hidden" name="id" value={row.id} />
                <div className="flex flex-wrap gap-3">
                  <label className="text-xs">
                    BASE注文番号
                    <input
                      name="baseOrderNumber"
                      defaultValue={row.baseOrderNumber ?? ""}
                      className="mt-1 block w-40 rounded border border-stone-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs">
                    BASE注文者名
                    <input
                      name="baseBuyerName"
                      defaultValue={row.baseBuyerName ?? ""}
                      className="mt-1 block w-40 rounded border border-stone-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs">
                    ステータス
                    <select
                      name="status"
                      defaultValue={row.status}
                      className="mt-1 block rounded border border-stone-300 px-2 py-1 text-sm"
                    >
                      {DIARY_BOOK_BINDING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {DIARY_BOOK_BINDING_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
                >
                  保存
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
