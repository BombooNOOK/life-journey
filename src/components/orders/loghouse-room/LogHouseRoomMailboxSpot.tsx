"use client";

import Image from "next/image";

import {
  LOG_HOUSE_ROOM_MAILBOX_MAIL_SRC,
  LOG_HOUSE_ROOM_MAILBOX_SRC,
} from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_SPOT_COPY } from "@/lib/loghouse/logHouseRoomCopy";
import { LOG_HOUSE_ROOM_MAILBOX_HOTSPOT } from "@/lib/loghouse/logHouseMailboxLayout";

type Props = {
  onActivate: () => void;
  disabled?: boolean;
  showDebugOutline?: boolean;
  showHintLabel?: boolean;
  flash?: boolean;
  /** 未読があるとき、お手紙ありポスト画像を使う */
  hasUnread?: boolean;
};

/** 玄関ポスト（靴の近く・未読で画像切替） */
export function LogHouseRoomMailboxSpot({
  onActivate,
  disabled = false,
  showDebugOutline = false,
  showHintLabel = false,
  flash = false,
  hasUnread = false,
}: Props) {
  const spot = LOG_HOUSE_ROOM_MAILBOX_HOTSPOT;
  const copy = LOG_HOUSE_ROOM_SPOT_COPY.mailbox;
  const src = hasUnread ? LOG_HOUSE_ROOM_MAILBOX_MAIL_SRC : LOG_HOUSE_ROOM_MAILBOX_SRC;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${copy.label}：${copy.description}${hasUnread ? "（未読あり）" : ""}`}
      onClick={onActivate}
      className={[
        "absolute z-[24] transition duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
        disabled
          ? "cursor-not-allowed opacity-40"
          : showDebugOutline
            ? "rounded-xl border-2 border-dashed border-blue-400/55 bg-blue-50/10"
            : "rounded-lg border-2 border-transparent hover:brightness-105 active:scale-[0.98]",
        flash ? "brightness-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.width}%`,
        height: `${spot.height}%`,
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        aria-hidden
        className="pointer-events-none object-contain object-bottom"
        sizes="22vw"
        unoptimized
        priority={hasUnread}
      />

      {showHintLabel ? (
        <span
          className={[
            "pointer-events-none absolute left-1/2 z-10 -translate-x-1/2",
            spot.hintLabelEdge === "below"
              ? "top-full mt-0.5"
              : spot.hintLabelEdge === "inside-bottom"
                ? "bottom-0"
                : spot.hintLabelEdge === "inside-top"
                  ? "top-0"
                  : "bottom-full mb-1",
          ].join(" ")}
        >
          <span className="inline-block whitespace-nowrap rounded-full bg-[#fffdf9]/85 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-stone-700 shadow-sm ring-1 ring-stone-300/35">
            {copy.label}
          </span>
        </span>
      ) : null}
    </button>
  );
}
