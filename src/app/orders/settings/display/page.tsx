import { redirect } from "next/navigation";

import { MyPageDisplaySettingsSection } from "@/components/orders/MyPageDisplaySettingsSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsDisplayPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/display");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="表示設定"
        description="文字の大きさなど、読みやすさの設定を変更できます"
      />

      <MyPageDisplaySettingsSection showHeading={false} />
    </div>
  );
}
