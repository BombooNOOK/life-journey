import Link from "next/link";
import { notFound } from "next/navigation";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { countSocialPostDraftsByStatus, listSocialPostDrafts } from "@/lib/admin/post-atelier/queries";
import {
  SOCIAL_POST_DRAFT_STATUS_LABELS,
  type SocialPostDraftStatus,
} from "@/lib/admin/post-atelier/types";
import { getCompanionLabel } from "@/lib/journal/meta";

export const dynamic = "force-dynamic";

export default async function PostAtelierPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const [statusCounts, recentDrafts] = await Promise.all([
    countSocialPostDraftsByStatus(),
    listSocialPostDrafts({}, 8),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者ページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">BambooNOOK 投稿アトリエ</h1>
        <p className="mt-1 text-sm text-stone-600">
          Instagram 等の毎日投稿用文案を作成・保存・コピー・ステータス管理します（SNS API 連携なし）。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/post-atelier/daily-number/new"
          className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          今日のこころ予報を作成
        </Link>
        <Link
          href="/admin/post-atelier/new"
          className="rounded-xl bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          新規投稿案を作成
        </Link>
        <Link
          href="/admin/post-atelier/posts"
          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          投稿一覧
        </Link>
        <Link
          href="/admin/post-atelier/calendar"
          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          予定カレンダー
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {(Object.keys(SOCIAL_POST_DRAFT_STATUS_LABELS) as SocialPostDraftStatus[]).map((status) => (
          <div
            key={status}
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-center"
          >
            <p className="text-xs text-stone-500">{SOCIAL_POST_DRAFT_STATUS_LABELS[status]}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{statusCounts[status]}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-stone-900">最近更新した投稿案</h2>
        {recentDrafts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
            まだ投稿案がありません。「新規投稿案を作成」から始めてください。
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {recentDrafts.map((draft) => (
              <li key={draft.id}>
                <Link
                  href={
                    draft.postType === "daily_number"
                      ? `/admin/post-atelier/daily-number/${draft.id}`
                      : `/admin/post-atelier/${draft.id}`
                  }
                  className="block px-4 py-3 hover:bg-violet-50/40"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5">
                      {SOCIAL_POST_DRAFT_STATUS_LABELS[draft.status]}
                    </span>
                    {draft.scheduledDate ? <span>{draft.scheduledDate}</span> : null}
                    <span>{getCompanionLabel(draft.companionType)}</span>
                  </div>
                  <p className="mt-1 font-medium text-stone-900">
                    {draft.theme.trim() || "（テーマ未入力）"}
                  </p>
                  {draft.bodyPreview ? (
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{draft.bodyPreview}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
