"use client";

import Link from "next/link";

import {
  LOG_HOUSE_ROOM_KANTEI_LOCK_CTA_LABEL,
  LOG_HOUSE_ROOM_SPOT_COPY,
} from "@/lib/loghouse/logHouseRoomCopy";
import type { LogHouseRoomSpotId } from "@/lib/loghouse/logHouseRoomHotspots";

type Props = {
  spotId: LogHouseRoomSpotId;
  lockMessage?: string | null;
  /** 鑑定ロック時など、説明の下に出す導線 */
  lockCtaHref?: string | null;
  lockCtaLabel?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

/** 家具タップ後の説明シート（タイトル・短い説明・遷移） */
export function LogHouseRoomSpotSheet({
  spotId,
  lockMessage = null,
  lockCtaHref = null,
  lockCtaLabel = null,
  onClose,
  onConfirm,
  busy = false,
}: Props) {
  const copy = LOG_HOUSE_ROOM_SPOT_COPY[spotId];
  const locked = Boolean(lockMessage);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[56] px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`loghouse-spot-sheet-${spotId}`}
        className="mx-auto max-w-md rounded-2xl border border-stone-200/80 bg-[#fffdf9]/95 px-4 py-4 shadow-lg backdrop-blur-[2px]"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2
            id={`loghouse-spot-sheet-${spotId}`}
            className="text-sm font-semibold text-stone-900"
          >
            {copy.label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <p className="text-sm leading-relaxed text-stone-600">
          {locked ? lockMessage : copy.description}
        </p>
        {locked && lockCtaHref ? (
          <p className="mt-3 text-center text-sm">
            <Link
              href={lockCtaHref}
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              {lockCtaLabel ?? LOG_HOUSE_ROOM_KANTEI_LOCK_CTA_LABEL}
            </Link>
          </p>
        ) : null}
        {!locked ? (
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-300/80 bg-emerald-50/90 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {copy.actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
