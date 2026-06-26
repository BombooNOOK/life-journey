import Link from "next/link";
import { notFound } from "next/navigation";

import { PostAtelierDraftForm } from "@/components/admin/post-atelier/PostAtelierDraftForm";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { getSocialPostDraftById } from "@/lib/admin/post-atelier/queries";
import { SOCIAL_POST_DRAFT_STATUS_LABELS, SOCIAL_POST_PLATFORM_LABELS } from "@/lib/admin/post-atelier/types";
import { getCompanionLabel } from "@/lib/journal/meta";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; err?: string }>;
};

export default async function PostAtelierEditPage({ params, searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const { id } = await params;
  const draft = await getSocialPostDraftById(id);
  if (!draft) {
    notFound();
  }

  const query = await searchParams;
  const saved = query.saved === "1";
  const err = query.err?.trim();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/post-atelier/posts" className="text-sm text-stone-600 hover:text-stone-900">
          ← 投稿一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">投稿案を編集</h1>
        <p className="mt-1 text-sm text-stone-600">
          {draft.theme.trim() || "（テーマ未入力）"} ／ {getCompanionLabel(draft.companionType)} ／{" "}
          {SOCIAL_POST_PLATFORM_LABELS[draft.platform]}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          ステータス: {SOCIAL_POST_DRAFT_STATUS_LABELS[draft.status]} ／ 最終更新:{" "}
          {draft.updatedAt.toLocaleString("ja-JP")} ／ 更新者: {draft.authorEmail}
        </p>
      </div>

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          保存しました。
        </div>
      ) : null}

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div>
      ) : null}

      <PostAtelierDraftForm
        mode="edit"
        draftId={draft.id}
        initialValues={{
          theme: draft.theme,
          companionType: draft.companionType,
          platform: draft.platform,
          scheduledDate: draft.scheduledDate,
          todayNumber: draft.todayNumber,
          bodyText: draft.bodyText,
          hashtags: draft.hashtags,
          imageMemo: draft.imageMemo,
          linkUrl: draft.linkUrl,
          internalMemo: draft.internalMemo,
          status: draft.status,
        }}
      />
    </div>
  );
}
