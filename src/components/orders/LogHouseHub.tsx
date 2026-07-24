"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import {
  resolveFirstVisitGuideState,
  type FirstVisitGuideState,
} from "@/lib/onboarding/firstVisitGuideState";
import type { DonguriChoView } from "@/lib/loghouse/donguriTypes";
import { useIsLogHouseMobileViewport } from "@/lib/loghouse/logHouseViewport";
import type { FirstVisitReadyContext } from "@/lib/viewer/firstVisitReadyContext";

type ProfileRow = { id: string; nickname: string };

type Props = {
  profiles: ProfileRow[];
  activeProfileId: string;
  hasKanteiOrder: boolean;
  activeKanteiOrderId: string | null;
  mailboxUnreadCount?: number;
  donguriCho?: DonguriChoView;
  entitlement: SerializedUserEntitlement;
  firstVisitGuideState: FirstVisitGuideState;
  companionWritingHref: string;
  deskWritingHref: string;
  viewerEmail: string;
  viewerIsAdmin: boolean;
  adminLink: React.ReactNode;
  legalFooter: React.ReactNode;
};

/**
 * 鑑定直後に /orders の SSR が古いと「未鑑定ロック」と「鑑定済み」が食い違う。
 * API で再確認し、あれば即時アンロック＋refresh する。
 */
function useReconcileKanteiUnlock(input: {
  hasKanteiOrder: boolean;
  activeKanteiOrderId: string | null;
  firstVisitGuideState: FirstVisitGuideState;
}) {
  const router = useRouter();
  const [hasKanteiOrder, setHasKanteiOrder] = useState(input.hasKanteiOrder);
  const [activeKanteiOrderId, setActiveKanteiOrderId] = useState(input.activeKanteiOrderId);
  const [firstVisitGuideState, setFirstVisitGuideState] = useState(input.firstVisitGuideState);

  useEffect(() => {
    setHasKanteiOrder(input.hasKanteiOrder);
    setActiveKanteiOrderId(input.activeKanteiOrderId);
    setFirstVisitGuideState(input.firstVisitGuideState);
  }, [input.hasKanteiOrder, input.activeKanteiOrderId, input.firstVisitGuideState]);

  useEffect(() => {
    if (input.hasKanteiOrder && input.activeKanteiOrderId) return;

    let cancelled = false;
    void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("ready context failed");
        return (await res.json()) as FirstVisitReadyContext;
      })
      .then((ctx) => {
        if (cancelled || ctx.branch !== "hasKantei") return;
        setHasKanteiOrder(true);
        if (ctx.kanteiOrderId) setActiveKanteiOrderId(ctx.kanteiOrderId);
        setFirstVisitGuideState(
          resolveFirstVisitGuideState({
            hasKanteiOrder: true,
            journalEntryCount: ctx.journalEntryCount,
          }),
        );
        router.refresh();
      })
      .catch(() => {
        // SSR のまま続行
      });

    return () => {
      cancelled = true;
    };
  }, [input.hasKanteiOrder, input.activeKanteiOrderId, router]);

  return { hasKanteiOrder, activeKanteiOrderId, firstVisitGuideState };
}

const MAILBOX_UNREAD_SHAKE_SESSION_KEY = "ljd.loghouseRoom.mailboxUnreadShake.v1";

/**
 * お手紙既読後に /orders へ戻ると、Router Cache の古い unreadCount で
 * ポスト画像が未読のまま戻る。一覧と同様 API で突き合わせる。
 */
function useReconcileMailboxUnread(initialCount: number) {
  const router = useRouter();
  const [mailboxUnreadCount, setMailboxUnreadCount] = useState(initialCount);

  useEffect(() => {
    setMailboxUnreadCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;

    const refreshUnread = async () => {
      try {
        const res = await fetch("/api/loghouse/mailbox", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { unreadCount?: number };
        if (cancelled || typeof json.unreadCount !== "number") return;
        const nextCount = json.unreadCount;
        setMailboxUnreadCount((prev) => {
          if (prev === nextCount) return prev;
          if (nextCount === 0) {
            try {
              window.sessionStorage.removeItem(MAILBOX_UNREAD_SHAKE_SESSION_KEY);
            } catch {
              // ignore
            }
          }
          return nextCount;
        });
        if (nextCount !== initialCount) {
          router.refresh();
        }
      } catch {
        // SSR のまま続行
      }
    };

    void refreshUnread();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshUnread();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initialCount, router]);

  return mailboxUnreadCount;
}

/** ログハウス：スマホ＝没入室内UI、PC＝既存カードUI */
export function LogHouseHub({
  profiles,
  activeProfileId,
  hasKanteiOrder: hasKanteiOrderProp,
  activeKanteiOrderId: activeKanteiOrderIdProp,
  mailboxUnreadCount: mailboxUnreadCountProp = 0,
  donguriCho,
  entitlement,
  firstVisitGuideState: firstVisitGuideStateProp,
  companionWritingHref,
  deskWritingHref,
  viewerEmail,
  viewerIsAdmin,
  adminLink,
  legalFooter,
}: Props) {
  const isMobile = useIsLogHouseMobileViewport();
  const [manageOpen, setManageOpen] = useState(false);
  const { hasKanteiOrder, activeKanteiOrderId, firstVisitGuideState } = useReconcileKanteiUnlock({
    hasKanteiOrder: hasKanteiOrderProp,
    activeKanteiOrderId: activeKanteiOrderIdProp,
    firstVisitGuideState: firstVisitGuideStateProp,
  });
  const mailboxUnreadCount = useReconcileMailboxUnread(mailboxUnreadCountProp);

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
          hasKanteiOrder={hasKanteiOrder}
          kanteiOrderId={activeKanteiOrderId}
          mailboxUnreadCount={mailboxUnreadCount}
          donguriCho={donguriCho}
          companionWritingHref={companionWritingHref}
          deskWritingHref={deskWritingHref}
          firstVisitGuideState={firstVisitGuideState}
          onOpenManage={() => setManageOpen(true)}
          viewerIsAdmin={viewerIsAdmin}
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
          blockNewKantei={false}
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
          mailboxUnreadCount={mailboxUnreadCount}
        />
      ) : null}

      <MyPageGuideLink />

      <MyPageManageHub activeProfileId={activeProfileId || null} />

      <div className="border-t border-stone-200 pt-6">{legalFooter}</div>
      {viewerIsAdmin ? <div className="border-t border-stone-200 pt-6">{adminLink}</div> : null}
    </div>
  );
}
