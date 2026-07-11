"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from "react";

import { LogHouseRoomChrome } from "@/components/orders/loghouse-room/LogHouseRoomChrome";
import { LogHouseRoomPartsLayer } from "@/components/orders/loghouse-room/LogHouseRoomPartsLayer";
import { LogHouseRoomRabbitAvatar } from "@/components/orders/loghouse-room/LogHouseRoomRabbitAvatar";
import { LogHouseRoomSpotSheet } from "@/components/orders/loghouse-room/LogHouseRoomSpotSheet";
import { LogHouseRoomTapSpot } from "@/components/orders/loghouse-room/LogHouseRoomTapSpot";
import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";
import {
  LOG_HOUSE_ROOM_MOBILE_BG_SRC,
  LOG_HOUSE_ROOM_MOBILE_INTRINSIC,
} from "@/lib/loghouse/logHouseRoomAssets";
import {
  LOG_HOUSE_ROOM_FIRST_VISIT_TIP,
  LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY,
  LOG_HOUSE_ROOM_HINT_AUTO_HIDE_MS,
  LOG_HOUSE_ROOM_JOURNAL_LOCK_MESSAGE,
  LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE,
} from "@/lib/loghouse/logHouseRoomCopy";
import { LOG_HOUSE_ROOM_HOTSPOTS, type LogHouseRoomSpotId } from "@/lib/loghouse/logHouseRoomHotspots";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type SpotAction = {
  href: string | null;
  needsProfile?: boolean;
  /** 鑑定前など：見た目は通常のまま、タップで案内を出す */
  lockMessage?: string | null;
};

type Props = {
  profileId: string;
  profiles: ProfileRow[];
  activeProfileId: string;
  entitlement: SerializedUserEntitlement;
  kanteiOrderId: string | null;
  companionWritingHref: string | null;
  onOpenManage: () => void;
  className?: string;
  previewMode?: boolean;
  layout?: "immersive" | "framed";
};

/** 576×1024 を viewport に cover 相当で広げる（座標は相対維持） */
function coverStageStyle(size: { widthPx: number; heightPx: number }): CSSProperties {
  const ratio = size.widthPx / size.heightPx;
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: `max(100vw, calc(100dvh * ${ratio}))`,
    height: `max(100dvh, calc(100vw / ${ratio}))`,
    transform: "translate(-50%, -50%)",
  };
}

function RoomStage({
  busy,
  previewMode,
  spotActions,
  onSpotActivate,
  hintActive,
  flashSpotId,
}: {
  busy: boolean;
  previewMode: boolean;
  spotActions: Record<LogHouseRoomSpotId, SpotAction>;
  onSpotActivate: (spotId: LogHouseRoomSpotId) => void;
  hintActive: boolean;
  flashSpotId: LogHouseRoomSpotId | null;
}) {
  return (
    <>
      <Image
        src={LOG_HOUSE_ROOM_MOBILE_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover object-center"
        draggable={false}
        unoptimized
      />

      <LogHouseRoomPartsLayer />

      <div className="absolute inset-0 z-[20] overflow-hidden" style={{ touchAction: "manipulation" }}>
        {LOG_HOUSE_ROOM_HOTSPOTS.map((spot) => {
          const action = spotActions[spot.id];
          const locked = Boolean(action.lockMessage);
          const disabled = busy || (!locked && action.href == null);

          return (
            <LogHouseRoomTapSpot
              key={spot.id}
              spot={spot}
              disabled={disabled}
              showDebugOutline={previewMode}
              showHintLabel={hintActive}
              flash={flashSpotId === spot.id}
              onActivate={() => onSpotActivate(spot.id)}
            />
          );
        })}

        <LogHouseRoomRabbitAvatar />
      </div>
    </>
  );
}

/** スマホ縦長：没入型ログハウス室内（全画面 + 家具タップ） */
export function LogHouseRoomMobile({
  profileId,
  activeProfileId,
  entitlement,
  kanteiOrderId,
  onOpenManage,
  className = "",
  previewMode = false,
  layout = "immersive",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profileBusy, setProfileBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hintActive, setHintActive] = useState(false);
  const [showFirstVisitTip, setShowFirstVisitTip] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<LogHouseRoomSpotId | null>(null);
  const [flashSpotId, setFlashSpotId] = useState<LogHouseRoomSpotId | null>(null);
  const busy = isPending || profileBusy;

  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalBlocked = entitlement.tier === "trial_expired" || !canWriteJournal;
  const isActiveProfile = profileId === activeProfileId;
  const hasKantei = Boolean(kanteiOrderId);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (previewMode) {
      setShowFirstVisitTip(true);
      return;
    }
    try {
      const seen = window.localStorage.getItem(LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY);
      if (!seen) setShowFirstVisitTip(true);
    } catch {
      setShowFirstVisitTip(true);
    }
  }, [previewMode]);

  useEffect(() => {
    if (!hintActive) return;
    const timer = window.setTimeout(() => setHintActive(false), LOG_HOUSE_ROOM_HINT_AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [hintActive]);

  useEffect(() => {
    if (!flashSpotId) return;
    const timer = window.setTimeout(() => setFlashSpotId(null), 420);
    return () => window.clearTimeout(timer);
  }, [flashSpotId]);

  const dismissFirstVisitTip = useCallback(() => {
    setShowFirstVisitTip(false);
    if (previewMode) return;
    try {
      window.localStorage.setItem(LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, [previewMode]);

  const toggleHint = useCallback(() => {
    setHintActive((prev) => !prev);
    dismissFirstVisitTip();
  }, [dismissFirstVisitTip]);

  const navigate = useCallback(
    async (href: string, needsProfileSelect: boolean) => {
      if (busy) return;
      try {
        if (needsProfileSelect && !isActiveProfile && !previewMode) {
          setProfileBusy(true);
          const result = await selectViewerProfile(profileId);
          setProfileBusy(false);
          if (!result.ok) {
            window.alert(result.error);
            return;
          }
        }
        startTransition(() => {
          router.push(href);
        });
      } catch {
        setProfileBusy(false);
        window.alert("ページへ移動できませんでした。もう一度お試しください。");
      }
    },
    [busy, isActiveProfile, previewMode, profileId, router, startTransition],
  );

  const spotActions: Record<LogHouseRoomSpotId, SpotAction> = useMemo(
    () => ({
      bookshelf: hasKantei
        ? { href: "/orders/bookshelf", needsProfile: true }
        : { href: null, lockMessage: LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE },
      desk: !hasKantei
        ? { href: null, lockMessage: LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE }
        : journalBlocked
          ? { href: null, lockMessage: LOG_HOUSE_ROOM_JOURNAL_LOCK_MESSAGE }
          : { href: "/orders/calendar", needsProfile: true },
      residentCard: { href: "/orders/resident-card" },
      todayResult: hasKantei
        ? { href: `/orders/${encodeURIComponent(kanteiOrderId!)}` }
        : { href: null, lockMessage: LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE },
      radio: { href: buildForestMusicHallHref("/orders") },
    }),
    [hasKantei, journalBlocked, kanteiOrderId],
  );

  useEffect(() => {
    if (previewMode) return;
    for (const action of Object.values(spotActions)) {
      if (action.href) router.prefetch(action.href);
    }
  }, [previewMode, router, spotActions]);

  const onSpotActivate = useCallback((spotId: LogHouseRoomSpotId) => {
    setFlashSpotId(spotId);
    setSelectedSpotId(spotId);
    setHintActive(false);
    dismissFirstVisitTip();
  }, [dismissFirstVisitTip]);

  const selectedAction = selectedSpotId ? spotActions[selectedSpotId] : null;

  const confirmSelectedSpot = useCallback(() => {
    if (!selectedSpotId || !selectedAction?.href) return;
    const href = selectedAction.href;
    const needsProfile = selectedAction.needsProfile === true;
    setSelectedSpotId(null);
    void navigate(href, needsProfile);
  }, [navigate, selectedAction, selectedSpotId]);

  const noticeOverlay = notice ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[55] flex justify-center px-4">
      <p
        role="status"
        className="max-w-sm rounded-xl border border-emerald-200/90 bg-[#fffdf9]/95 px-3.5 py-2.5 text-center text-xs leading-relaxed text-stone-700 shadow-lg backdrop-blur-[1px]"
      >
        {notice}
      </p>
    </div>
  ) : null;

  const firstVisitTipOverlay = showFirstVisitTip ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[54] flex justify-center px-4">
      <div className="pointer-events-auto max-w-sm rounded-xl border border-emerald-200/80 bg-[#fffdf9]/95 px-3.5 py-3 text-center shadow-lg backdrop-blur-[1px]">
        <p className="whitespace-pre-line text-xs leading-relaxed text-stone-700">
          {LOG_HOUSE_ROOM_FIRST_VISIT_TIP}
        </p>
        <button
          type="button"
          onClick={dismissFirstVisitTip}
          className="mt-2 inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 text-xs font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          わかった
        </button>
      </div>
    </div>
  ) : null;

  const spotSheet =
    selectedSpotId && selectedAction ? (
      <>
        <button
          type="button"
          className="absolute inset-0 z-[55] bg-stone-900/15"
          aria-label="説明を閉じる"
          onClick={() => setSelectedSpotId(null)}
        />
        <LogHouseRoomSpotSheet
          spotId={selectedSpotId}
          lockMessage={selectedAction.lockMessage}
          busy={busy}
          onClose={() => setSelectedSpotId(null)}
          onConfirm={confirmSelectedSpot}
        />
      </>
    ) : null;

  const busyOverlay = (
    <OwlDelayedBusyOverlay busy={busy} spinnerDelayMs={0} className="bg-white/15" />
  );

  const chrome = (
    <LogHouseRoomChrome
      onOpenSettings={onOpenManage}
      hintActive={hintActive}
      onToggleHint={toggleHint}
    />
  );

  const stage = (
    <RoomStage
      busy={busy}
      previewMode={previewMode}
      spotActions={spotActions}
      onSpotActivate={onSpotActivate}
      hintActive={hintActive}
      flashSpotId={flashSpotId}
    />
  );

  if (layout === "framed") {
    return (
      <div
        className={[
          "relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          aspectRatio: `${LOG_HOUSE_ROOM_MOBILE_INTRINSIC.widthPx} / ${LOG_HOUSE_ROOM_MOBILE_INTRINSIC.heightPx}`,
        }}
      >
        <div className="absolute inset-0 isolate overflow-hidden">{stage}</div>
        {chrome}
        {firstVisitTipOverlay}
        {noticeOverlay}
        {spotSheet}
        {busyOverlay}
        <p className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</p>
      </div>
    );
  }

  return (
    <div
      className={[
        "fixed inset-0 z-[60] overflow-hidden overscroll-none bg-[#ebe4d4]",
        "select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative isolate overflow-hidden" style={coverStageStyle(LOG_HOUSE_ROOM_MOBILE_INTRINSIC)}>
          {stage}
        </div>
      </div>

      {chrome}
      {firstVisitTipOverlay}
      {noticeOverlay}
      {spotSheet}
      {busyOverlay}
      <p className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</p>
    </div>
  );
}
