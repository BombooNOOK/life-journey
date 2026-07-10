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
import { LogHouseRoomTapSpot } from "@/components/orders/loghouse-room/LogHouseRoomTapSpot";
import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";
import {
  LOG_HOUSE_ROOM_MOBILE_BG_SRC,
  LOG_HOUSE_ROOM_MOBILE_INTRINSIC,
} from "@/lib/loghouse/logHouseRoomAssets";
import {
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
}: {
  busy: boolean;
  previewMode: boolean;
  spotActions: Record<LogHouseRoomSpotId, SpotAction>;
  onSpotActivate: (spotId: LogHouseRoomSpotId) => void;
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
        // keep owl visible for the whole transition (do not clear busy after push)
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

  const onSpotActivate = useCallback(
    (spotId: LogHouseRoomSpotId) => {
      const action = spotActions[spotId];
      if (action.lockMessage) {
        setNotice(action.lockMessage);
        return;
      }
      if (!action.href) return;
      void navigate(action.href, action.needsProfile === true);
    },
    [navigate, spotActions],
  );

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

  const busyOverlay = (
    <OwlDelayedBusyOverlay busy={busy} spinnerDelayMs={0} className="bg-white/15" />
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
        <div className="absolute inset-0 isolate overflow-hidden">
          <RoomStage
            busy={busy}
            previewMode={previewMode}
            spotActions={spotActions}
            onSpotActivate={onSpotActivate}
          />
        </div>
        <LogHouseRoomChrome onOpenSettings={onOpenManage} />
        {noticeOverlay}
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
          <RoomStage
            busy={busy}
            previewMode={previewMode}
            spotActions={spotActions}
            onSpotActivate={onSpotActivate}
          />
        </div>
      </div>

      <LogHouseRoomChrome onOpenSettings={onOpenManage} />
      {noticeOverlay}
      {busyOverlay}
      <p className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</p>
    </div>
  );
}
