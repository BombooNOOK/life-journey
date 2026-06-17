import Link from "next/link";
import { redirect } from "next/navigation";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { ProfileNicknameEditor } from "@/components/profile/ProfileNicknameEditor";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadMyPageSettingsContext } from "@/lib/mypage/loadMyPageSettingsContext";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsRenameProfilePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/rename-profile");
  }

  const { activeProfile } = await loadMyPageSettingsContext(viewerEmail);

  if (!activeProfile) {
    return (
      <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
        <MyPageSubpageHeader
          title="プロフィール名を変更"
          description="変更するプロフィールを選んでください"
        />
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
          <p>プロフィールがまだありません。先にプロフィールを追加してください。</p>
          <Link
            href="/orders/settings/add-profile"
            className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            プロフィールを追加する →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="プロフィール名を変更"
        description={`選択中のプロフィール「${activeProfile.nickname}」の名前を変更できます`}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <ProfileNicknameEditor profileId={activeProfile.id} initialNickname={activeProfile.nickname} />
      </section>
    </div>
  );
}
