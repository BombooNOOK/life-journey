import Link from "next/link";
import { notFound } from "next/navigation";

import { BookBindingAdminFilterBar } from "@/components/admin/BookBindingAdminFilterBar";
import { updateKanteiBookBindingRequest } from "@/app/admin/kantei-book-binding/actions";
import { KanteiBookBindingPrintDownload } from "@/components/admin/KanteiBookBindingPrintDownload";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import {
  bookBindingStatusWhereClause,
  mapStatusCounts,
  openStatusTotal,
} from "@/lib/commerce/bookBindingAdminFilter";
import {
  KANTEI_BOOK_BINDING_STATUSES,
  KANTEI_BOOK_BINDING_STATUS_LABELS,
} from "@/lib/commerce/kanteiBookBindingStatus";
import { prisma } from "@/lib/db";
import { resolveKanteiPdfDownloadFilename } from "@/lib/order/kanteiCode";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminKanteiBookBindingPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) notFound();

  const { q = "", status: statusFilter = "" } = await searchParams;
  const keyword = q.trim();

  const statusClause = bookBindingStatusWhereClause(statusFilter);

  const where: {
    status?: string | { in: string[] };
    OR?: Array<
      | { email: { contains: string; mode: "insensitive" } }
      | { kanteiCode: { contains: string; mode: "insensitive" } }
      | { fullNameDisplay: { contains: string; mode: "insensitive" } }
      | { baseOrderNumber: { contains: string; mode: "insensitive" } }
    >;
  } = { ...statusClause };

  if (keyword) {
    where.OR = [
      { email: { contains: keyword, mode: "insensitive" } },
      { kanteiCode: { contains: keyword, mode: "insensitive" } },
      { fullNameDisplay: { contains: keyword, mode: "insensitive" } },
      { baseOrderNumber: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [rows, statusGroups] = await Promise.all([
    prisma.kanteiBookBindingRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.kanteiBookBindingRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts = mapStatusCounts(statusGroups);
  const openTotal = openStatusTotal(statusCounts);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者（ユーザー一覧）
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">鑑定書 製本申込予定</h1>
        <p className="mt-1 text-sm text-stone-600">
          ユーザーが「製本版を注文する」から進んだ申込予定です。BASE決済後に照合し、ステータスを更新してください。
        </p>
      </div>

      <BookBindingAdminFilterBar
        basePath="/admin/kantei-book-binding"
        statusFilter={statusFilter}
        keyword={keyword}
        statusCounts={statusCounts}
        openTotal={openTotal}
        searchPlaceholder="検索（メール・鑑定コード・氏名・BASE注文番号）"
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
                  <p className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                    {KANTEI_BOOK_BINDING_STATUS_LABELS[
                      row.status as keyof typeof KANTEI_BOOK_BINDING_STATUS_LABELS
                    ] ?? row.status}
                  </p>
                </div>
                <p className="font-mono text-sm text-stone-800">{row.kanteiCode}</p>
              </div>

              <dl className="mt-3 grid gap-1 text-sm text-stone-700 sm:grid-cols-2">
                <div>
                  <span className="text-stone-500">対象者: </span>
                  {row.fullNameDisplay}（{row.birthDate}）
                </div>
                <div>
                  <span className="text-stone-500">メール: </span>
                  {row.email}
                </div>
                <div>
                  <span className="text-stone-500">鑑定作成: </span>
                  {row.orderCreatedAt.toLocaleString("ja-JP")}
                </div>
                <div>
                  <span className="text-stone-500">プロフィールID: </span>
                  <span className="font-mono text-xs">{row.profileId || "—"}</span>
                </div>
              </dl>

              <form action={updateKanteiBookBindingRequest} className="mt-4 space-y-3 border-t border-stone-100 pt-4">
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
                      {KANTEI_BOOK_BINDING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {KANTEI_BOOK_BINDING_STATUS_LABELS[s]}
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

              <div className="mt-3">
                <KanteiBookBindingPrintDownload
                  orderId={row.orderId}
                  printHref={`/api/orders/${row.orderId}/pdf?download=1&quality=high`}
                  suggestedFileName={resolveKanteiPdfDownloadFilename(
                    row.orderId,
                    row.kanteiCode,
                    "print",
                  )}
                  kanteiCode={row.kanteiCode}
                  fullNameDisplay={row.fullNameDisplay}
                  birthDate={row.birthDate}
                  baseOrderNumber={row.baseOrderNumber}
                  baseBuyerName={row.baseBuyerName}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
