import Link from "next/link";
import { notFound } from "next/navigation";

import { createSystemNoticeAction } from "@/app/admin/system-notices/actions";
import { AdminSystemNoticeForm } from "@/components/admin/AdminSystemNoticeForm";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { SYSTEM_NOTICE_SENDER_NAME } from "@/lib/loghouse/systemNoticeTypes";

type Props = {
  searchParams: Promise<{ err?: string }>;
};

export default async function AdminSystemNoticeNewPage({ searchParams }: Props) {
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();

  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link
          href="/admin/system-notices"
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← {SYSTEM_NOTICE_SENDER_NAME}一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">新規お知らせ</h1>
      </div>

      {params.err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {params.err}
        </div>
      ) : null}

      <AdminSystemNoticeForm mode="create" action={createSystemNoticeAction} />
    </div>
  );
}
