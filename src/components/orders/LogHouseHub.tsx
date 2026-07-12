"use client";

import { useState } from "react";

import {
  FirstVisitGuidePanel,
  ReturningUserGuideHint,
} from "@/components/guide/FirstVisitGuidePanel";
import { MyPageGuideLink } from "@/components/guide/MyPageGuideLink";
import { KanteiMissingBanner } from "@/components/orders/KanteiMissingBanner";
import { LogHouseRoomManageSheet } from "@/components/orders/loghouse-room/LogHouseRoomManageSheet";
import { LogHouseRoomMobile } from "@/components/orders/loghouse-room/LogHouseRoomMobile";
import { MyPageMainActions } from "@/components/orders/MyPageMainActions";
import { MyPagePageHeader } from "@/components/orders/MyPagePageHeader";
import { MyPageProfileList } from "@/components/orders/MyPageProfileList";
import { MyPageManageHub } from "@/components/orders/MyPageManageMenu";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import type { FirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";
import { useIsLogHouseMobileViewport } from "@/lib/loghouse/logHouseViewport";

type ProfileRow = { id: string; nickname: string };

type Props = {
  profiles: ProfileRow[];
  activeProfileId: string;
  hasKanteiOrder: boolean;
  activeKanteiOrderId: string | null;
  entitlement: SerializedUserEntitlement;
  firstVisitGuideState: FirstVisitGuideState;
  companionWritingHref: string;
  viewerEmail: string;
  viewerIsAdmin: boolean;
  adminLink: React.ReactNode;
  legalFooter: React.ReactNode;
};

/** ログハウス：スマホ＝没入室内UI、PC＝既存カードUI */
export function LogHouseHub({
  profiles,
  activeProfileId,
  hasKanteiOrder,
  activeKanteiOrderId,
  entitlement,
  firstVisitGuideState,
  companionWritingHref,
  viewerEmail,
  viewerIsAdmin,
  adminLink,
  legalFooter,
}: Props) {
  const isMobile = useIsLogHouseMobileViewport();
  const [manageOpen, setManageOpen] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  if (isMobile) {
    if (!activeProfile) {
      return (
        <div className="space-y-5 px-4 py-6 sm:space-y-6">
          <MyPagePageHeader />
          <MyPageProfileList profiles={profiles} activeProfileId={activeProfileId} />
          <MyPageManageHub activeProfileId={activeProfileId || null} />
          <div className="border-t border-stone-200 pt-6">{legalFooter}</div>
        </div>
      );
    }

    return (
      <>
        <LogHouseRoomMobile
          profileId={activeProfile.id}
          profiles={profiles}
          activeProfileId={activeProfileId}
          entitlement={entitlement}
          kanteiOrderId={activeKanteiOrderId}
          companionWritingHref={companionWritingHref}
          onOpenManage={() => setManageOpen(true)}
        />

        <LogHouseRoomManageSheet
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          profiles={profiles}
          activeProfileId={activeProfileId}
          companionWritingHref={companionWritingHref}
          viewerEmail={viewerEmail}
        />
      </>
    );
  }

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

      <div className="border-t border-stone-200 pt-6">{legalFooter}</div>
      {viewerIsAdmin ? <div className="border-t border-stone-200 pt-6">{adminLink}</div> : null}
    </div>
  );
}
