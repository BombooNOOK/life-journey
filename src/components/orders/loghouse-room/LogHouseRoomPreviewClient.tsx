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

/** ログハウス室内UI — Cursor Simple Browser 用プレビュー */
export function LogHouseRoomPreviewClient() {
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
        <p>
          <strong>プレビュー</strong>（ログイン不要）。本番は{" "}
          <code className="rounded bg-amber-100 px-1">/orders</code>{" "}
          です。家具をタップすると各画面へ進みます（一部はログインが必要です）。
          青い点線はタップ枠の位置です。
        </p>
        <p className="mt-2">
          <Link href="/help/music-hall" className="font-medium underline-offset-2 hover:underline">
            森の小さな音楽堂
          </Link>
          {" · "}
          <Link href="/preview" className="font-medium underline-offset-2 hover:underline">
            プレビュー一覧
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
