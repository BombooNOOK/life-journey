import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProfileDetailActiveSync } from "@/components/profile/ProfileDetailActiveSync";
import { ProfileNicknameEditor } from "@/components/profile/ProfileNicknameEditor";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";
import {
  listProfilesAndActiveProfileId,
  profileByIdForViewer,
} from "@/lib/profile/activeProfile";
import { parseProfileIdFromRouteParam } from "@/lib/profile/parseProfileIdFromRouteParam";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ profileId: string }>;
};

/**
 * 内部記録枠の詳細。
 * 一般ユーザーには出さず森の住民票へ誘導。admin のみ既存枠の識別名編集用に残す。
 */
export default async function ProfileDetailPage({ params }: Props) {
  const { profileId: profileIdRaw } = await params;
  const profileId = parseProfileIdFromRouteParam(profileIdRaw);
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders");
  }

  const viewerIsAdmin = await isAdminEmail(viewerEmail);
  if (!viewerIsAdmin) {
    redirect("/orders/resident-card");
  }

  const profile = await withPrismaConnectionRetry(() =>
    profileByIdForViewer(profileId, viewerEmail),
  );
  if (!profile) {
    notFound();
  }

  const { activeProfileId } = await withPrismaConnectionRetry(() =>
    listProfilesAndActiveProfileId(viewerEmail),
  );

  const isActive = activeProfileId === profileId;

  return (
    <div className="space-y-6">
      <ProfileDetailActiveSync profileId={profile.id} isActive={isActive} />
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          {LOG_HOUSE_BACK_LINK.label}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{profile.nickname}</h1>
        <p className="mt-1 text-sm text-stone-600">管理者：既存記録枠の識別名を変更できます。</p>
        <p className="mt-2 text-xs text-stone-500">
          {isActive ? "現在選択中の記録枠です。" : "表示を切り替えています。"}
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">記録枠（内部）</h2>
        <ProfileNicknameEditor profileId={profile.id} initialNickname={profile.nickname} />
        <dl className="space-y-2 border-t border-stone-100 pt-3 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-28 shrink-0 text-stone-500">記録枠ID</dt>
            <dd className="break-all text-stone-700">{profile.id}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
