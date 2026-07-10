"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { LogHouseRoomPartsLayer } from "@/components/orders/loghouse-room/LogHouseRoomPartsLayer";
import { LogHouseRoomRabbitAvatar } from "@/components/orders/loghouse-room/LogHouseRoomRabbitAvatar";
import { LogHouseRoomTapSpot } from "@/components/orders/loghouse-room/LogHouseRoomTapSpot";
import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import {
  LOG_HOUSE_ROOM_MOBILE_BG_SRC,
  LOG_HOUSE_ROOM_MOBILE_INTRINSIC,
} from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_HOTSPOTS } from "@/lib/loghouse/logHouseRoomHotspots";
import { LOG_HOUSE_ROOM_MANAGE_BUTTON_LABEL } from "@/lib/loghouse/logHouseRoomCopy";
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
  /** プレビュー：プロフィール API を呼ばない */
  previewMode?: boolean;
};

function aspectRatio(size: { widthPx: number; heightPx: number }): string {
  return `${size.widthPx} / ${size.heightPx}`;
}

/** スマホ縦長：ログハウス室内（背景 + 家具タップ） */
export function LogHouseRoomMobile({
  profileId,
  profiles,
  activeProfileId,
  entitlement,
  kanteiOrderId,
  companionWritingHref,
  onOpenManage,
  className = "",
  previewMode = false,
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
    radio: { href: "/help/music-hall" },
  };

  const activeProfileName =
    profiles.find((p) => p.id === activeProfileId)?.nickname ?? "プロフィール";

  return (
    <figure className={["relative mx-auto w-full max-w-md", className].filter(Boolean).join(" ")}>
      <div
        className="relative isolate w-full overflow-hidden rounded-2xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm"
        style={{ aspectRatio: aspectRatio(LOG_HOUSE_ROOM_MOBILE_INTRINSIC) }}
      >
        <Image
          src={LOG_HOUSE_ROOM_MOBILE_BG_SRC}
          alt=""
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 28rem"
          className="z-0 object-contain object-center"
          unoptimized
        />

        <LogHouseRoomPartsLayer />

        <div className="absolute inset-0 z-[20] overflow-hidden" aria-hidden={false}>
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

        <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-3 pb-2 pt-2">
          <p className="max-w-[65%] rounded-lg bg-white/82 px-2.5 py-1.5 text-[11px] leading-snug text-stone-700 shadow-sm backdrop-blur-[1px]">
            <span className="font-semibold text-stone-900">【{activeProfileName}】</span>
            <span className="text-stone-600"> のログハウス</span>
          </p>
          <button
            type="button"
            onClick={onOpenManage}
            className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-stone-200/90 bg-white/90 text-stone-700 shadow-sm backdrop-blur-[1px] transition hover:bg-white"
            aria-label={`${LOG_HOUSE_ROOM_MANAGE_BUTTON_LABEL}メニューを開く`}
          >
            <span className="text-lg leading-none" aria-hidden>
              ☰
            </span>
          </button>
        </div>

        {busy ? (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-white/25">
            <div className="rounded-xl border border-emerald-100 bg-white/95 px-3 py-2 shadow-sm">
              <OwlLoadingInline label="ログハウスから移動しています…" size="sm" />
            </div>
          </div>
        ) : null}
      </div>

      <figcaption className="sr-only">ログハウス室内。家具をタップして各機能へ進めます。</figcaption>

      {companionWritingHref && canWriteJournal && kanteiOrderId ? (
        <p className="mt-3 text-center">
          <ProfileSelectNavButton
            profileId={profileId}
            href={companionWritingHref}
            directNav={isActiveProfile}
            loadingLabel="伴走画面を開いています…"
            className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            どうぶつ鑑定士といっしょに書く →
          </ProfileSelectNavButton>
        </p>
      ) : null}
    </figure>
  );
}
