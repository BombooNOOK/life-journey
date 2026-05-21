import Link from "next/link";
import { notFound } from "next/navigation";

import { updateDiaryBookBindingRequest } from "@/app/admin/diary-book-binding/actions";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
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

  const where: {
    status?: string;
    OR?: Array<
      | { email: { contains: string; mode: "insensitive" } }
      | { diaryBindingCode: { contains: string; mode: "insensitive" } }
      | { displayTitle: { contains: string; mode: "insensitive" } }
      | { baseOrderNumber: { contains: string; mode: "insensitive" } }
    >;
  } = {};

  if (statusFilter) {
    where.status = statusFilter;
  }
  if (keyword) {
    where.OR = [
      { email: { contains: keyword, mode: "insensitive" } },
      { diaryBindingCode: { contains: keyword, mode: "insensitive" } },
      { displayTitle: { contains: keyword, mode: "insensitive" } },
      { baseOrderNumber: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.diaryBookBindingRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者（ユーザー一覧）
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">日記 製本申込予定</h1>
        <p className="mt-1 text-sm text-stone-600">
          ユーザーが本棚から「製本申込コードを発行」した申込予定です。BASEの「製本申込コード」と照合し、ステータスを更新してください。
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-stone-600">検索（製本申込コード・メール・表示名・BASE注文番号）</span>
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
            defaultValue={statusFilter}
            className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">すべて</option>
            {DIARY_BOOK_BINDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DIARY_BOOK_BINDING_STATUS_LABELS[s]}
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
      </form>

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
                <div>
                  <span className="text-stone-500">年: </span>
                  {row.year}年
                  {row.displayTitle ? `（${row.displayTitle}）` : null}
                </div>
                <div>
                  <span className="text-stone-500">ページ数: </span>
                  {row.pageCount}
                </div>
                <div>
                  <span className="text-stone-500">プラン: </span>
                  {planLabel(row.planId)}
                  <span className="font-mono text-xs text-stone-500"> ({row.planId})</span>
                </div>
                <div>
                  <span className="text-stone-500">製本期間: </span>
                  {row.periodStartMonth}月〜{row.periodEndMonth}月
                </div>
                <div>
                  <span className="text-stone-500">メール: </span>
                  {row.email}
                </div>
                <div>
                  <span className="text-stone-500">プロフィールID: </span>
                  <span className="font-mono text-xs">{row.profileId || "—"}</span>
                </div>
              </dl>

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
