import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProfileDetailActiveSync } from "@/components/profile/ProfileDetailActiveSync";
import { ProfileNicknameEditor } from "@/components/profile/ProfileNicknameEditor";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  listProfilesAndActiveProfileId,
  profileByIdForViewer,
} from "@/lib/profile/activeProfile";
import { parseProfileIdFromRouteParam } from "@/lib/profile/parseProfileIdFromRouteParam";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ profileId: string }>;
};

export default async function ProfileDetailPage({ params }: Props) {
  const { profileId: profileIdRaw } = await params;
  const profileId = parseProfileIdFromRouteParam(profileIdRaw);
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders");
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
          ← マイページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{profile.nickname}</h1>
        <p className="mt-1 text-sm text-stone-600">プロフィール名を変更できます。</p>
        <p className="mt-2 text-xs text-stone-500">
          {isActive ? "現在選択中のプロフィールです。" : "表示を切り替えています。"}
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">プロフィール情報</h2>
        <ProfileNicknameEditor profileId={profile.id} initialNickname={profile.nickname} />
        <dl className="space-y-2 border-t border-stone-100 pt-3 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-28 shrink-0 text-stone-500">プロフィールID</dt>
            <dd className="break-all text-stone-700">{profile.id}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
