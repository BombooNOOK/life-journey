"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState, type CSSProperties } from "react";

import { LogHouseRoomChrome } from "@/components/orders/loghouse-room/LogHouseRoomChrome";
import { LogHouseRoomPartsLayer } from "@/components/orders/loghouse-room/LogHouseRoomPartsLayer";
import { LogHouseRoomRabbitAvatar } from "@/components/orders/loghouse-room/LogHouseRoomRabbitAvatar";
import { LogHouseRoomTapSpot } from "@/components/orders/loghouse-room/LogHouseRoomTapSpot";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import {
  LOG_HOUSE_ROOM_MOBILE_BG_SRC,
  LOG_HOUSE_ROOM_MOBILE_INTRINSIC,
} from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_HOTSPOTS } from "@/lib/loghouse/logHouseRoomHotspots";
import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type Props = {
  profileId: string;
  profiles: ProfileRow[];
  activeProfileId: string;
  entitlement: SerializedUserEntitlement;
  kanteiOrderId: string | null;
  companionWritingHref: string | null;
  onOpenManage: () => void;
  className?: string;
  /** プレビュー：プロフィール API を呼ばない・タップ枠を表示 */
  previewMode?: boolean;
  /**
   * immersive = 本番スマホの全画面没入
   * framed = 定規など枠内プレビュー
   */
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
  navigate,
}: {
  busy: boolean;
  previewMode: boolean;
  spotActions: Record<
    (typeof LOG_HOUSE_ROOM_HOTSPOTS)[number]["id"],
    { href: string | null; disabled?: boolean; needsProfile?: boolean }
  >;
  navigate: (href: string, needsProfileSelect: boolean) => Promise<void>;
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

      <div
        className="absolute inset-0 z-[20] overflow-hidden"
        style={{ touchAction: "manipulation" }}
      >
        {LOG_HOUSE_ROOM_HOTSPOTS.map((spot) => {
          const action = spotActions[spot.id];
          const disabled = busy || action.disabled || action.href == null;

          return (
            <LogHouseRoomTapSpot
              key={spot.id}
              spot={spot}
              disabled={disabled}
              showDebugOutline={previewMode}
              onActivate={() => {
                if (!action.href) return;
                void navigate(action.href, action.needsProfile === true);
              }}
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
  const [busy, setBusy] = useState(false);

  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalBlocked = entitlement.tier === "trial_expired" || !canWriteJournal;
  const isActiveProfile = profileId === activeProfileId;

  const navigate = useCallback(
    async (href: string, needsProfileSelect: boolean) => {
      if (busy) return;
      setBusy(true);
      try {
        if (needsProfileSelect && !isActiveProfile && !previewMode) {
          const result = await selectViewerProfile(profileId);
          if (!result.ok) {
            window.alert(result.error);
            return;
          }
        }
        router.push(href);
      } catch {
        window.alert("ページへ移動できませんでした。もう一度お試しください。");
      } finally {
        setBusy(false);
      }
    },
    [busy, isActiveProfile, previewMode, profileId, router],
  );

  const spotActions: Record<
    (typeof LOG_HOUSE_ROOM_HOTSPOTS)[number]["id"],
    { href: string | null; disabled?: boolean; needsProfile?: boolean }
  > = {
    bookshelf: { href: "/orders/bookshelf", needsProfile: true },
    desk: {
      href: journalBlocked ? null : "/orders/calendar",
      disabled: journalBlocked,
      needsProfile: true,
    },
    residentCard: { href: "/orders/resident-card" },
    todayResult: {
      href: kanteiOrderId ? `/orders/${encodeURIComponent(kanteiOrderId)}` : null,
      disabled: !kanteiOrderId,
    },
    radio: { href: buildForestMusicHallHref("/orders") },
  };

  const busyOverlay = busy ? (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-white/25">
      <div className="rounded-xl border border-emerald-100 bg-white/95 px-3 py-2 shadow-sm">
        <OwlLoadingInline label="ログハウスから移動しています…" size="sm" />
      </div>
    </div>
  ) : null;

  if (layout === "framed") {
    return (
      <div
        className={["relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm", className]
          .filter(Boolean)
          .join(" ")}
        style={{ aspectRatio: `${LOG_HOUSE_ROOM_MOBILE_INTRINSIC.widthPx} / ${LOG_HOUSE_ROOM_MOBILE_INTRINSIC.heightPx}` }}
      >
        <div className="absolute inset-0 isolate overflow-hidden">
          <RoomStage busy={busy} previewMode={previewMode} spotActions={spotActions} navigate={navigate} />
        </div>
        <LogHouseRoomChrome onOpenSettings={onOpenManage} />
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
          <RoomStage busy={busy} previewMode={previewMode} spotActions={spotActions} navigate={navigate} />
        </div>
      </div>

      <LogHouseRoomChrome onOpenSettings={onOpenManage} />
      {busyOverlay}
      <p className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</p>
    </div>
  );
}
