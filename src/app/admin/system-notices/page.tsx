import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { SYSTEM_NOTICE_SENDER_NAME } from "@/lib/loghouse/systemNoticeTypes";
import { listSystemNoticesForAdmin } from "@/lib/loghouse/systemNotices";

type Props = {
  searchParams: Promise<{ saved?: string; err?: string }>;
};

export default async function AdminSystemNoticesPage({ searchParams }: Props) {
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();

  const params = await searchParams;
  const rows = await listSystemNoticesForAdmin();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者ページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{SYSTEM_NOTICE_SENDER_NAME}</h1>
        <p className="mt-1 text-sm text-stone-600">
          全ユーザー共通のお知らせです。ヤギさん郵便の個別配信とは別枠で、ポスト一覧に表示されます。
          テストや特定の方だけへの連絡は「個別送信」を使ってください。
        </p>
      </div>

      {params.err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {params.err}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          保存しました。
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/admin/system-notices/individual"
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          個別送信
        </Link>
        <Link
          href="/admin/system-notices/new"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          共通お知らせを作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-medium">タイトル</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3 font-medium">公開日</th>
              <th className="px-4 py-3 font-medium">更新</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  まだお知らせがありません
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/system-notices/${row.id}`}
                      className="font-medium text-emerald-900 underline-offset-2 hover:underline"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{row.statusLabel}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {row.publishedAt
                      ? new Date(row.publishedAt).toLocaleString("ja-JP")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {new Date(row.updatedAt).toLocaleString("ja-JP")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
