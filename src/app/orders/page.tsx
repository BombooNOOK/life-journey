import Link from "next/link";

import {
  FirstVisitGuidePanel,
  ReturningUserGuideHint,
} from "@/components/guide/FirstVisitGuidePanel";
import { MyPageGuideLink } from "@/components/guide/MyPageGuideLink";
import { LogHouseGuestEntrance } from "@/components/orders/LogHouseGuestEntrance";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { KanteiMissingBanner } from "@/components/orders/KanteiMissingBanner";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { MyPageManageHub } from "@/components/orders/MyPageManageMenu";
import { MyPageMainActions } from "@/components/orders/MyPageMainActions";
import { MyPagePageHeader } from "@/components/orders/MyPagePageHeader";
import { MyPageProfileList } from "@/components/orders/MyPageProfileList";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { resolvePrimaryKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
  type SerializedUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { calendarDayKeyInJapan, journalWithCompanionPath } from "@/lib/journal/journalNav";
import { resolveFirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return <LogHouseGuestEntrance />;
  }

  const viewerIsAdmin = await isAdminEmail(viewerEmail);

  let profiles: Awaited<ReturnType<typeof listProfilesAndActiveProfileId>>["profiles"] = [];
  let activeProfileId = "";
  let fetchError: string | null = null;
  let hasKanteiOrder = true;
  let activeKanteiOrderId: string | null = null;
  let journalEntryCount = 0;
  let entitlement: SerializedUserEntitlement = {
    tier: "trial_not_started",
    showTrialBanner: false,
    bannerVariant: "none",
    canUseContinuedFeatures: false,
    canCreateFirstJournal: true,
    trialDaysRemaining: null,
    trialDayIndex: null,
  };
  try {
    const loaded = await withPrismaConnectionRetry(async () => {
      const profileData = await listProfilesAndActiveProfileId(viewerEmail);
      const kanteiOrder = await resolvePrimaryKanteiOrderForProfile({
        viewerEmail,
        profileId: profileData.activeProfileId,
      });
      const entitlementCtx = await loadEntitlementContext(viewerEmail);
      return { profileData, kanteiOrder, entitlementCtx };
    });
    profiles = loaded.profileData.profiles;
    activeProfileId = loaded.profileData.activeProfileId;
    hasKanteiOrder = loaded.kanteiOrder != null;
    activeKanteiOrderId = loaded.kanteiOrder?.id ?? null;
    journalEntryCount = loaded.entitlementCtx.journalEntryCount;
    entitlement = serializeUserEntitlement(resolveUserEntitlement(loaded.entitlementCtx));
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "一覧を取得できませんでした。";
  }

  if (fetchError) {
    return <LogHouseLoadErrorPanel detail={fetchError} />;
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;
  const firstVisitGuideState = resolveFirstVisitGuideState({
    hasKanteiOrder,
    journalEntryCount,
  });
  const companionWritingHref =
    activeProfile != null
      ? journalWithCompanionPath(
          "/orders",
          activeProfile.id,
          calendarDayKeyInJapan(new Date()),
        )
      : journalWithCompanionPath("/orders");

  return (
      <div className="space-y-5 sm:space-y-6">
      <MyPagePageHeader />

      <MyPageProfileList profiles={profiles} activeProfileId={activeProfileId} />

      <TrialStatusBanner entitlement={entitlement} />

      {activeProfile ? (
        <FirstVisitGuidePanel
          state={firstVisitGuideState}
          profileId={activeProfile.id}
          companionWritingHref={companionWritingHref}
        />
      ) : null}

      {firstVisitGuideState === "returning" ? <ReturningUserGuideHint /> : null}

      {activeProfile && !hasKanteiOrder ? (
        <KanteiMissingBanner
          profileId={activeProfile.id}
          blockNewKantei={entitlement.tier === "trial_expired"}
        />
      ) : null}

      {activeProfile ? (
        <MyPageMainActions
          profileId={activeProfile.id}
          isActive
          entitlement={entitlement}
          kanteiOrderId={activeKanteiOrderId}
          firstVisitGuideState={firstVisitGuideState}
          companionWritingHref={companionWritingHref}
        />
      ) : null}

      <MyPageGuideLink />

      <MyPageManageHub activeProfileId={activeProfileId || null} />

      <div className="border-t border-stone-200 pt-6">
        <LegalFooterLinks />
      </div>

      {viewerIsAdmin ? (
        <div className="border-t border-stone-200 pt-6">
          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            管理者ページへ
          </Link>
        </div>
      ) : null}

      </div>
  );
}
