import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { LogHouseDeskWritingChoice } from "@/components/orders/LogHouseDeskWritingChoice";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import { calendarDayKeyInJapan, journalWithCompanionPath } from "@/lib/journal/journalNav";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";
import {
  LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_PAGE_PATH,
  LOG_HOUSE_DESK_WRITE_PAGE_TITLE,
} from "@/lib/loghouse/logHouseDeskWritingChoice";
import { resolveFirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { resolvePrimaryKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: LOG_HOUSE_DESK_WRITE_PAGE_TITLE,
  description: LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION,
};

export default async function LogHouseDeskWritePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(LOG_HOUSE_DESK_WRITE_PAGE_PATH)}`);
  }

  try {
    const { activeProfileId, profiles, kanteiOrder, journalEntryCount } =
      await withPrismaConnectionRetry(async () => {
        const profileData = await listProfilesAndActiveProfileId(viewerEmail);
        const kantei = await resolvePrimaryKanteiOrderForProfile({
          viewerEmail,
          profileId: profileData.activeProfileId,
        });
        const entitlementCtx = await loadEntitlementContext(viewerEmail);
        return {
          activeProfileId: profileData.activeProfileId,
          profiles: profileData.profiles,
          kanteiOrder: kantei,
          journalEntryCount: entitlementCtx.journalEntryCount,
        };
      });

    if (!activeProfileId || profiles.length === 0) {
      return (
        <div className="mx-auto w-full max-w-md space-y-4">
          <MyPageSubpageHeader
            title={LOG_HOUSE_DESK_WRITE_PAGE_TITLE}
            description={LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION}
          />
          <p className="text-sm text-stone-600">日記を書くには、プロフィールが必要です。</p>
          <Link href="/orders" className="text-sm text-emerald-900 underline-offset-2 hover:underline">
            {LOG_HOUSE_BACK_TO_LABEL}
          </Link>
        </div>
      );
    }

    const firstVisitGuideState = resolveFirstVisitGuideState({
      hasKanteiOrder: kanteiOrder != null,
      journalEntryCount,
    });

    const companionWritingHref = journalWithCompanionPath(
      "/orders",
      activeProfileId,
      calendarDayKeyInJapan(new Date()),
    );

    // はじめての方は選択を挟まず伴走執筆へ
    if (firstVisitGuideState === "ready_first_journal") {
      redirect(companionWritingHref);
    }

    if (firstVisitGuideState === "needs_kantei") {
      redirect("/orders");
    }

    return (
      <LogHouseDeskWritingChoice
        companionWritingHref={companionWritingHref}
        profiles={profiles}
        activeProfileId={activeProfileId}
      />
    );
  } catch (e) {
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "書き方の選択を開けませんでした。"}
      />
    );
  }
}
