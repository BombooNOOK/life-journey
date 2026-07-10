"use client";

import type { ReactNode } from "react";

import {
  LOG_HOUSE_ROOM_SPOT_COPY,
} from "@/lib/loghouse/logHouseRoomCopy";
import type { LogHouseRoomHotspot } from "@/lib/loghouse/logHouseRoomHotspots";

type Props = {
  spot: LogHouseRoomHotspot;
  onActivate: () => void;
  disabled?: boolean;
  /** プレビュー用：タップ枠を半透明で表示 */
  showDebugOutline?: boolean;
  children?: ReactNode;
};

/** 室内の家具タップ領域（淡いラベル + 光） */
export function LogHouseRoomTapSpot({
  spot,
  onActivate,
  disabled = false,
  showDebugOutline = false,
  children,
}: Props) {
  const copy = LOG_HOUSE_ROOM_SPOT_COPY[spot.id];

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${copy.label}：${copy.description}`}
      onClick={onActivate}
      className={[
        "group absolute z-[24] rounded-xl border-2 transition duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
        disabled
          ? "cursor-not-allowed border-transparent opacity-40"
          : showDebugOutline
            ? "border-blue-400/55 border-dashed bg-blue-50/10 hover:border-amber-200/70 hover:bg-amber-50/20 active:scale-[0.99] active:bg-amber-100/25"
            : "border-transparent bg-white/0 hover:border-amber-200/70 hover:bg-amber-50/20 active:scale-[0.99] active:bg-amber-100/25",
      ].join(" ")}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.width}%`,
        height: `${spot.height}%`,
      }}
    >
      <span
        className={[
          "pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5",
          "opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100",
        ].join(" ")}
      >
        <span className="rounded-full bg-white/88 px-2 py-0.5 text-[10px] font-semibold text-stone-800 shadow-sm ring-1 ring-stone-200/80 backdrop-blur-[1px]">
          {copy.label}
        </span>
        <span className="hidden max-w-[7rem] text-center text-[9px] leading-tight text-stone-700/90 sm:block">
          {copy.description}
        </span>
      </span>
      {children}
    </button>
  );
}
