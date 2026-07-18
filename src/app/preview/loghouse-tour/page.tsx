import { redirect } from "next/navigation";

import { LogHouseTourPreviewClient } from "@/components/orders/loghouse-room/LogHouseTourPreviewClient";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

const TOUR_PREVIEW_PATH = "/preview/loghouse-tour";

/**
 * はじめてのログハウス案内の通し確認。
 * - ローカル開発: ログイン不要
 * - 本番: 管理者ログイン時のみ（スマホ実機確認用）
 */
export default async function LogHouseTourPreviewPage() {
  if (process.env.NODE_ENV === "development") {
    return <LogHouseTourPreviewClient />;
  }

  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(TOUR_PREVIEW_PATH)}`);
  }
  if (!(await isAdminEmail(viewerEmail))) {
    redirect("/orders");
  }

  return <LogHouseTourPreviewClient />;
}
