import Link from "next/link";
import { redirect } from "next/navigation";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

/** 内部ニックネーム編集は一般向けに出さない。住民票のおなまえへ誘導する。 */
export default async function MyPageSettingsRenameProfilePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/rename-profile");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="ご案内"
        description="おなまえの変更は、森の住民票から行えます"
      />
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
        <p>
          森に載るおなまえは、森の住民票で確認・変更できます。
        </p>
        <Link
          href="/orders/resident-card"
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          森の住民票へ →
        </Link>
      </div>
    </div>
  );
}
