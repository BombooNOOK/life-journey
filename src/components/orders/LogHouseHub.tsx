"use client";

import { useLayoutEffect, useState } from "react";

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

type ProfileRow = { id: string; nickname: string };

type Props = {
  profiles: ProfileRow[];
  activeProfileId: string;
  hasKanteiOrder: boolean;
  activeKanteiOrderId: string | null;
  entitlement: SerializedUserEntitlement;
  firstVisitGuideState: FirstVisitGuideState;
  companionWritingHref: string;
  viewerIsAdmin: boolean;
  adminLink: React.ReactNode;
  legalFooter: React.ReactNode;
};

function useLogHouseViewport(): "mobile" | "desktop" {
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setViewport(mq.matches ? "desktop" : "mobile");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return viewport;
}

/** ログハウス：スマホ＝室内UI、PC＝既存カードUI */
export function LogHouseHub({
  profiles,
  activeProfileId,
  hasKanteiOrder,
  activeKanteiOrderId,
  entitlement,
  firstVisitGuideState,
  companionWritingHref,
  viewerIsAdmin,
  adminLink,
  legalFooter,
}: Props) {
  const viewport = useLogHouseViewport();
  const [manageOpen, setManageOpen] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  if (viewport === "mobile") {
    if (!activeProfile) {
      return (
        <div className="space-y-5 sm:space-y-6">
          <MyPagePageHeader />
          <MyPageProfileList profiles={profiles} activeProfileId={activeProfileId} />
          <MyPageManageHub activeProfileId={activeProfileId || null} />
          <div className="border-t border-stone-200 pt-6">{legalFooter}</div>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-lg:-mx-4 max-lg:max-w-none max-lg:px-0">
        <TrialStatusBanner entitlement={entitlement} />

        <FirstVisitGuidePanel
          state={firstVisitGuideState}
          profileId={activeProfile.id}
          companionWritingHref={companionWritingHref}
        />

        {firstVisitGuideState === "returning" ? <ReturningUserGuideHint /> : null}

        {!hasKanteiOrder ? (
          <div className="px-4">
            <KanteiMissingBanner
              profileId={activeProfile.id}
              blockNewKantei={entitlement.tier === "trial_expired"}
            />
          </div>
        ) : null}

        <LogHouseRoomMobile
          profileId={activeProfile.id}
          profiles={profiles}
          activeProfileId={activeProfileId}
          entitlement={entitlement}
          kanteiOrderId={activeKanteiOrderId}
          companionWritingHref={companionWritingHref}
          onOpenManage={() => setManageOpen(true)}
        />

        <div className="px-4">
          <MyPageGuideLink />
        </div>

        <LogHouseRoomManageSheet
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          profiles={profiles}
          activeProfileId={activeProfileId}
          companionWritingHref={companionWritingHref}
        />

        <div className="border-t border-stone-200 px-4 pt-6">{legalFooter}</div>
        {viewerIsAdmin ? <div className="border-t border-stone-200 px-4 pt-6">{adminLink}</div> : null}
      </div>
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
