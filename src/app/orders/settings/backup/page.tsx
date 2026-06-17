import { redirect } from "next/navigation";

import { MyPageBackupSection } from "@/components/orders/MyPageBackupSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadMyPageSettingsContext } from "@/lib/mypage/loadMyPageSettingsContext";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsBackupPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/backup");
  }

  const { activeProfile } = await loadMyPageSettingsContext(viewerEmail);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="バックアップ作成"
        description="日記の記録をZIPファイルとして保存できます"
      />

      <MyPageBackupSection activeProfileNickname={activeProfile?.nickname ?? null} showHeading={false} />
    </div>
  );
}
