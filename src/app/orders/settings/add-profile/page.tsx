import Link from "next/link";
import { redirect } from "next/navigation";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { PROFILE_CREATE_DISABLED_USER_MESSAGE } from "@/lib/profile/viewerProfileUiPolicy";

export const dynamic = "force-dynamic";

/** 記録枠追加は停止。設定へ誘導する。 */
export default async function MyPageSettingsAddProfilePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/add-profile");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="ご案内"
        description="新しい記録枠の追加は、現在ご利用いただけません"
      />
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
        <p>{PROFILE_CREATE_DISABLED_USER_MESSAGE}</p>
        <p className="mt-2 text-stone-600">
          アカウントや表示などの設定は、設定画面から確認できます。
        </p>
        <Link
          href="/orders/settings"
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          設定へ →
        </Link>
      </div>
    </div>
  );
}
