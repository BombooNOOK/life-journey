"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { LogHouseRoomManageSheet } from "@/components/orders/loghouse-room/LogHouseRoomManageSheet";
import { LogHouseRoomMobile } from "@/components/orders/loghouse-room/LogHouseRoomMobile";
import { LOG_HOUSE_DESK_WRITE_PAGE_PATH } from "@/lib/loghouse/logHouseDeskWritingChoice";
import {
  LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF,
  LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT,
  LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID,
  LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID,
  LOG_HOUSE_ROOM_PREVIEW_PROFILES,
} from "@/lib/loghouse/logHouseRoomPreviewFixture";
import { LOG_HOUSE_LOAD_ERROR_TITLE } from "@/lib/journal/logHouseLabels";

type Props = {
  /** guest = 未ログイン / error = DB 読み込み失敗でも部屋を見せる */
  mode: "guest" | "error";
  /** error モード時の詳細 */
  errorDetail?: string | null;
};

/**
 * DB・ログインなしでもログハウス室内を見られるフォールバック。
 * 家具タップはプレビュー相当（実データ遷移は控えめ）。
 */
export function LogHouseOfflineBrowseClient({ mode, errorDetail = null }: Props) {
  const router = useRouter();
  const [manageOpen, setManageOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount((n) => n + 1);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative min-h-[100dvh]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[70] px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto max-w-md rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-[12px] leading-relaxed text-amber-950 shadow-md backdrop-blur-[2px]">
          {mode === "guest" ? (
            <>
              <p className="font-semibold text-amber-950">ログインなしで室内を見ています</p>
              <p className="mt-1 text-[11px] text-amber-900/90">
                見た目確認用です。机・本棚などはタップしても先には進みません（ラジカセの操作カードは開けます）。
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Link
                  href={buildLoginHref("/orders", "login")}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-800 px-3 text-xs font-medium text-white"
                >
                  ログインする
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-950">{LOG_HOUSE_LOAD_ERROR_TITLE}</p>
              <p className="mt-1 text-[11px] text-amber-900/90">
                いま室内の情報を読み込めませんでした。仮の室内を表示しています。通信や混雑のことがあるので、少し待ってから「もう一度読み込む」を試してください。
              </p>
              {errorDetail ? (
                <p className="mt-1.5 max-h-16 overflow-y-auto rounded-md border border-amber-200/80 bg-white/80 px-2 py-1 font-mono text-[10px] text-amber-950">
                  {errorDetail}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isPending}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-800 px-3 text-xs font-medium text-white disabled:opacity-60"
                >
                  {isPending ? "読み込み中…" : "もう一度読み込む"}
                </button>
                <Link
                  href="/preview/loghouse-room"
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 text-xs font-medium text-emerald-950"
                >
                  プレビューへ
                </Link>
              </div>
              {retryCount > 0 ? (
                <p className="mt-1 text-[10px] text-amber-800/80">再試行 {retryCount} 回目</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <LogHouseRoomMobile
        profileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        profiles={[...LOG_HOUSE_ROOM_PREVIEW_PROFILES]}
        activeProfileId={LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID}
        entitlement={LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT}
        hasKanteiOrder
        kanteiOrderId={LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID}
        companionWritingHref={LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF}
        deskWritingHref={LOG_HOUSE_DESK_WRITE_PAGE_PATH}
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
