import { redirect } from "next/navigation";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { ProfileAddCard } from "@/components/profile/ProfileAddCard";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadMyPageSettingsContext } from "@/lib/mypage/loadMyPageSettingsContext";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsAddProfilePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/add-profile");
  }

  const { profiles, profileLimit, subscriptionPlan, entitlement } =
    await loadMyPageSettingsContext(viewerEmail);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="プロフィールを追加"
        description="家族やテーマごとに、記録を分けて残せます"
      />

      <ProfileAddCard
        profileCount={profiles.length}
        profileLimit={profileLimit}
        subscriptionPlan={subscriptionPlan}
        blockContinuedFeatures={!entitlement.canUseContinuedFeatures}
        showHeading={false}
      />
    </div>
  );
}
