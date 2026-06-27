import Link from "next/link";
import { notFound } from "next/navigation";

import { DeletePostDraftButton } from "@/components/admin/post-atelier/DeletePostDraftButton";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { listSocialPostDrafts } from "@/lib/admin/post-atelier/queries";
import {
  SOCIAL_POST_DRAFT_STATUSES,
  SOCIAL_POST_DRAFT_STATUS_LABELS,
  SOCIAL_POST_PLATFORMS,
  SOCIAL_POST_PLATFORM_LABELS,
} from "@/lib/admin/post-atelier/types";
import { getCompanionLabel } from "@/lib/journal/meta";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; platform?: string; deleted?: string }>;
};

export default async function PostAtelierPostsPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const params = await searchParams;
  const statusFilter = params.status?.trim() ?? "";
  const platformFilter = params.platform?.trim() ?? "";
  const deleted = params.deleted === "1";

  const rows = await listSocialPostDrafts({
    status: statusFilter,
    platform: platformFilter,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/post-atelier" className="text-sm text-stone-600 hover:text-stone-900">
          ← 投稿アトリエ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">投稿一覧</h1>
        <p className="mt-1 text-sm text-stone-600">保存済みの投稿案を検索・編集します。</p>
      </div>

      {deleted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          投稿案を削除しました。
        </div>
      ) : null}

      <form
        action="/admin/post-atelier/posts"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4"
      >
        <label className="space-y-1">
          <span className="block text-xs font-medium text-stone-600">ステータス</span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">すべて</option>
            {SOCIAL_POST_DRAFT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SOCIAL_POST_DRAFT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-stone-600">投稿先</span>
          <select
            name="platform"
            defaultValue={platformFilter}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">すべて</option>
            {SOCIAL_POST_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {SOCIAL_POST_PLATFORM_LABELS[p]}
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
        <Link
          href="/admin/post-atelier/new"
          className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
        >
          新規作成
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-medium">予定日</th>
              <th className="px-4 py-3 font-medium">テーマ</th>
              <th className="px-4 py-3 font-medium">キャラ</th>
              <th className="px-4 py-3 font-medium">投稿先</th>
              <th className="px-4 py-3 font-medium">UD</th>
              <th className="px-4 py-3 font-medium">ステータス</th>
              <th className="px-4 py-3 font-medium">更新</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                  該当する投稿案がありません。
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 text-stone-700">{row.scheduledDate || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{row.theme.trim() || "（未入力）"}</p>
                    {row.postType === "daily_number" ? (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-900">
                        こころ予報
                      </span>
                    ) : null}
                    {row.bodyPreview ? (
                      <p className="mt-1 line-clamp-1 text-xs text-stone-500">{row.bodyPreview}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{getCompanionLabel(row.companionType)}</td>
                  <td className="px-4 py-3 text-stone-700">{SOCIAL_POST_PLATFORM_LABELS[row.platform]}</td>
                  <td className="px-4 py-3 text-stone-700">{row.todayNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                      {SOCIAL_POST_DRAFT_STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {row.updatedAt.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link
                        href={
                          row.postType === "daily_number"
                            ? `/admin/post-atelier/daily-number/${row.id}`
                            : `/admin/post-atelier/${row.id}`
                        }
                        className="text-violet-800 underline-offset-2 hover:underline"
                      >
                        編集
                      </Link>
                      <DeletePostDraftButton draftId={row.id} />
                    </div>
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
