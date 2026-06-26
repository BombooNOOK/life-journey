import Link from "next/link";
import { notFound } from "next/navigation";

import { DailyNumberPostEditor } from "@/components/admin/post-atelier/DailyNumberPostEditor";
import { DailyNumberLayoutRulerNav } from "@/components/admin/post-atelier/DailyNumberLayoutRulerNav";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { getDailyNumberDraftById, loadPayloadFromDraft } from "@/lib/admin/post-atelier/daily-number/draftQueries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; err?: string }>;
};

export default async function DailyNumberEditPage({ params, searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const { id } = await params;
  const draft = await getDailyNumberDraftById(id);
  if (!draft) {
    notFound();
  }

  const savedPayload = loadPayloadFromDraft(draft);

  const query = await searchParams;
  const saved = query.saved === "1";
  const err = query.err?.trim();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/post-atelier/posts" className="text-sm text-stone-600 hover:text-stone-900">
          ← 投稿一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">今日のこころ予報を編集</h1>
        <p className="mt-1 text-sm text-stone-600">{draft.theme}</p>
        <p className="mt-1 text-xs text-stone-500">
          予定日: {draft.scheduledDate || "—"} ／ 最終更新: {draft.updatedAt.toLocaleString("ja-JP")}
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

      <DailyNumberLayoutRulerNav draftId={draft.id} variant="edit" />

      <DailyNumberPostEditor
        mode="edit"
        draftId={draft.id}
        initialValues={{
          scheduledDate: draft.scheduledDate,
          companionType: draft.companionType,
          messageType: draft.messageType,
          coverVariantMode: savedPayload?.variantMode ?? "A",
          resolvedVariant:
            savedPayload?.variantMode === "random" ? savedPayload.variant : undefined,
          resolvedClosingVariant: savedPayload?.closingVariant,
          status: draft.status,
          internalMemo: draft.internalMemo,
        }}
      />
    </div>
  );
}
