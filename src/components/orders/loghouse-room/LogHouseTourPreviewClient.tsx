"use client";

import Link from "next/link";
import { useState } from "react";

import { LogHouseRoomManageSheet } from "@/components/orders/loghouse-room/LogHouseRoomManageSheet";
import { LogHouseRoomMobile } from "@/components/orders/loghouse-room/LogHouseRoomMobile";
import {
  LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF,
  LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT,
  LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID,
  LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID,
  LOG_HOUSE_ROOM_PREVIEW_PROFILES,
} from "@/lib/loghouse/logHouseRoomPreviewFixture";
import { LOG_HOUSE_DESK_WRITE_PAGE_PATH } from "@/lib/loghouse/logHouseDeskWritingChoice";
import { clearLoghouseTourStep } from "@/lib/onboarding/firstVisitWizard/loghouseTour";

const TOUR_PREVIEW_PATH = "/preview/loghouse-tour";

function resolveTourMailboxHref(): string {
  // /preview/mailbox は開発専用。本番プレビューでは本物のポストへ。
  if (process.env.NODE_ENV !== "development") {
    return "/orders/mailbox";
  }
  return `/preview/mailbox?returnTo=${encodeURIComponent(TOUR_PREVIEW_PATH)}`;
}

function resolveTourBookshelfHref(): string {
  // プレビュー本棚なら（管理者）ログイン後も案内へ戻りやすい。鑑定書は案内用ポップアップ。
  return `/preview/forest-bookshelf?returnTo=${encodeURIComponent(TOUR_PREVIEW_PATH)}`;
}

/** はじめてのログハウス案内だけを繰り返し確認するプレビュー */
export function LogHouseTourPreviewClient() {
  const [manageOpen, setManageOpen] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  const restart = () => {
    clearLoghouseTourStep();
    setRemountKey((n) => n + 1);
  };

  return (
    <div className="relative min-h-[100dvh]">
      <div className="pointer-events-none absolute inset-x-0 top-14 z-[70] px-3">
        <div className="pointer-events-auto mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm backdrop-blur-[1px]">
          <p>
            <strong>ログハウス案内プレビュー</strong>
            （ログイン不要・何度でも最初から）。本番の「見た」フラグは使いません。
          </p>
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={restart}
              className="font-medium underline-offset-2 hover:underline"
            >
              はじめから
            </button>
            <span aria-hidden>·</span>
            <Link href="/preview/loghouse-room" className="font-medium underline-offset-2 hover:underline">
              室内UI
            </Link>
            <span aria-hidden>·</span>
            <Link href="/preview" className="font-medium underline-offset-2 hover:underline">
              一覧
            </Link>
          </p>
        </div>
      </div>

      <LogHouseRoomMobile
        key={remountKey}
        profileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        profiles={[...LOG_HOUSE_ROOM_PREVIEW_PROFILES]}
        activeProfileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        entitlement={LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT}
        hasKanteiOrder
        kanteiOrderId={LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID}
        mailboxUnreadCount={1}
        companionWritingHref={LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF}
        deskWritingHref={LOG_HOUSE_DESK_WRITE_PAGE_PATH}
        firstVisitGuideState="ready_first_journal"
        forceTourPreview
        tourGuideReturnTo={TOUR_PREVIEW_PATH}
        tourMailboxHref={resolveTourMailboxHref()}
        tourBookshelfHref={resolveTourBookshelfHref()}
        onOpenManage={() => setManageOpen(true)}
        previewMode
        layout="immersive"
      />

      <LogHouseRoomManageSheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        profiles={[...LOG_HOUSE_ROOM_PREVIEW_PROFILES]}
        activeProfileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        companionWritingHref={LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF}
        previewMode
      />
    </div>
  );
}
