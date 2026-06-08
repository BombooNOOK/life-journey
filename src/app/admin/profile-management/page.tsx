import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileManagementClient } from "@/components/admin/ProfileManagementClient";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

export default async function AdminProfileManagementPage() {
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
        <h1 className="mt-2 text-2xl font-bold text-stone-900">プロフィール管理</h1>
        <p className="mt-1 text-sm text-stone-600">
          不要なプロフィールや復元検証用プロフィールを、運営側から安全に削除します。一般ユーザー向けの削除UIはありません。
        </p>
      </div>

      <ProfileManagementClient />
    </div>
  );
}
