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
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";

type Props = {
  /** framed = 定規ページ用の枠内表示 */
  layout?: "immersive" | "framed";
  /** `?theme=day|night` で昼夜確認 */
  timeOfDayOverride?: LogHouseRoomTimeOfDay;
};

/** ログハウス室内UI — プレビュー（PCでも部屋全体が見える枠表示が既定） */
export function LogHouseRoomPreviewClient({
  layout = "framed",
  timeOfDayOverride,
}: Props) {
  const [manageOpen, setManageOpen] = useState(false);

  if (layout === "framed") {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center gap-3 px-3 py-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm">
          <p>
            <strong>プレビュー</strong>（スマホ枠・部屋全体）。没入型は{" "}
            <Link
              href="/preview/loghouse-room?view=immersive"
              className="font-medium underline-offset-2 hover:underline"
            >
              こちら
            </Link>
            （PC幅だと上下が切れることがあります）。本番は{" "}
            <code className="rounded bg-amber-100 px-1">/orders</code>
            （幅1023px以下）。
          </p>
          <p className="mt-1">
            昼夜確認:{" "}
            <Link href="/preview/loghouse-room?theme=day" className="font-medium underline-offset-2 hover:underline">
              昼
            </Link>
            {" · "}
            <Link href="/preview/loghouse-room?theme=night" className="font-medium underline-offset-2 hover:underline">
              夜
            </Link>
            {" · "}
            <Link
              href="/help/music-hall?returnTo=%2Fpreview%2Floghouse-room"
              className="font-medium underline-offset-2 hover:underline"
            >
              音楽堂
            </Link>
            {" · "}
            <Link href="/preview" className="font-medium underline-offset-2 hover:underline">
              一覧
            </Link>
            {" · "}
            <Link
              href="/preview/loghouse-room/layout"
              className="font-medium underline-offset-2 hover:underline"
            >
              定規
            </Link>
          </p>
        </div>

        <LogHouseRoomMobile
          profileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
          profiles={[...LOG_HOUSE_ROOM_PREVIEW_PROFILES]}
          activeProfileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
          entitlement={LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT}
          kanteiOrderId={LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID}
          companionWritingHref={LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF}
          onOpenManage={() => setManageOpen(true)}
          previewMode
          layout="framed"
          timeOfDayOverride={timeOfDayOverride}
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

  return (
    <div className="relative min-h-[100dvh]">
      <div className="pointer-events-none absolute inset-x-0 top-14 z-[70] px-3">
        <div className="pointer-events-auto mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm backdrop-blur-[1px]">
          <p>
            <strong>プレビュー</strong>（没入型）。PC幅では上下が切れることがあります。部屋全体は{" "}
            <Link href="/preview/loghouse-room" className="font-medium underline-offset-2 hover:underline">
              枠表示
            </Link>
            へ。昼夜:{" "}
            <Link
              href="/preview/loghouse-room?view=immersive&theme=day"
              className="font-medium underline-offset-2 hover:underline"
            >
              昼
            </Link>
            {" · "}
            <Link
              href="/preview/loghouse-room?view=immersive&theme=night"
              className="font-medium underline-offset-2 hover:underline"
            >
              夜
            </Link>
          </p>
        </div>
      </div>

      <LogHouseRoomMobile
        profileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        profiles={[...LOG_HOUSE_ROOM_PREVIEW_PROFILES]}
        activeProfileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        entitlement={LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT}
        kanteiOrderId={LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID}
        companionWritingHref={LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF}
        onOpenManage={() => setManageOpen(true)}
        previewMode
        layout="immersive"
        timeOfDayOverride={timeOfDayOverride}
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
