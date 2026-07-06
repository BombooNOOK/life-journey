import { notFound } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

/** 開発環境、または本番で管理者ログイン済みのときだけプレビューを許可する */
export async function assertDevOrAdminPreviewAccess(): Promise<void> {
  if (process.env.NODE_ENV === "development") return;

  const email = await getViewerEmailFromCookie();
  if (!email || !(await isAdminEmail(email))) {
    notFound();
  }
}
