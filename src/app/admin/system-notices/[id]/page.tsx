import Link from "next/link";
import { notFound } from "next/navigation";

import {
  publishSystemNoticeAction,
  unpublishSystemNoticeAction,
  updateSystemNoticeAction,
} from "@/app/admin/system-notices/actions";
import { AdminSystemNoticeForm } from "@/components/admin/AdminSystemNoticeForm";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { SYSTEM_NOTICE_SENDER_NAME } from "@/lib/loghouse/systemNoticeTypes";
import { getSystemNoticeForAdmin } from "@/lib/loghouse/systemNotices";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; err?: string }>;
};

export default async function AdminSystemNoticeEditPage({ params, searchParams }: Props) {
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();

  const { id } = await params;
  const query = await searchParams;
  const notice = await getSystemNoticeForAdmin(id);
  if (!notice) notFound();

  const savedLabel =
    query.saved === "published"
      ? "公開しました。"
      : query.saved === "unpublished"
        ? "非公開にしました。"
        : query.saved
          ? "保存しました。"
          : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link
          href="/admin/system-notices"
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← {SYSTEM_NOTICE_SENDER_NAME}一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">お知らせを編集</h1>
        <p className="mt-1 text-sm text-stone-600">
          状態: <span className="font-medium text-stone-800">{notice.statusLabel}</span>
        </p>
      </div>

      {query.err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {query.err}
        </div>
      ) : null}
      {savedLabel ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          {savedLabel}
        </div>
      ) : null}

      <AdminSystemNoticeForm
        mode="edit"
        notice={notice}
        saveAction={updateSystemNoticeAction}
        publishAction={publishSystemNoticeAction}
        unpublishAction={unpublishSystemNoticeAction}
      />
    </div>
  );
}
