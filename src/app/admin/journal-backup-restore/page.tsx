import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalBackupRestoreClient } from "@/components/admin/JournalBackupRestoreClient";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

export default async function AdminJournalBackupRestorePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者ページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">日記バックアップ復元</h1>
        <p className="mt-1 text-sm text-stone-600">
          バックアップZIPから、復元先ユーザーの新規プロフィールとして日記を復元します。既存データは上書きしません。
        </p>
      </div>

      <JournalBackupRestoreClient />
    </div>
  );
}
