import { redirect } from "next/navigation";

import { MyPageBackupSection } from "@/components/orders/MyPageBackupSection";
import { MyPageDisplaySettingsSection } from "@/components/orders/MyPageDisplaySettingsSection";
import { MyPageHomeScreenTip } from "@/components/orders/MyPageHomeScreenTip";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { ProfileAddCard } from "@/components/profile/ProfileAddCard";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { effectiveProfileLimit } from "@/lib/profile/effectiveProfileLimit";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings");
  }

  const { profiles, activeProfileId } = await withPrismaConnectionRetry(() =>
    listProfilesAndActiveProfileId(viewerEmail),
  );
  const settings = await withPrismaConnectionRetry(() =>
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail },
      select: { profileLimit: true, subscriptionPlan: true },
    }),
  );
  const entitlementCtx = await withPrismaConnectionRetry(() =>
    loadEntitlementContext(viewerEmail),
  );
  const entitlement = serializeUserEntitlement(resolveUserEntitlement(entitlementCtx));
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="設定"
        description="プロフィールや表示の設定を変更できます"
      />

      <div id="add-profile" className="scroll-mt-24">
        <ProfileAddCard
          profileCount={profiles.length}
          profileLimit={effectiveProfileLimit(settings)}
          subscriptionPlan={settings?.subscriptionPlan ?? null}
          blockContinuedFeatures={!entitlement.canUseContinuedFeatures}
        />
      </div>

      <div id="display" className="scroll-mt-24">
        <MyPageDisplaySettingsSection />
      </div>

      <MyPageBackupSection activeProfileNickname={activeProfile?.nickname ?? null} />

      <MyPageHomeScreenTip />
    </div>
  );
}
