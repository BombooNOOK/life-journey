"use client";

import { LOG_HOUSE_ROOM_SPOT_COPY } from "@/lib/loghouse/logHouseRoomCopy";
import { LOG_HOUSE_ROOM_MAILBOX_HOTSPOT, LOG_HOUSE_ROOM_MAILBOX_PLACEMENT } from "@/lib/loghouse/logHouseMailboxLayout";

type Props = {
  onActivate: () => void;
  disabled?: boolean;
  showDebugOutline?: boolean;
  showHintLabel?: boolean;
  flash?: boolean;
  /** 未読があるとき、控えめなどんぐり印 */
  hasUnread?: boolean;
};

/** 玄関ポスト（靴の近く・仮ビジュアル） */
export function LogHouseRoomMailboxSpot({
  onActivate,
  disabled = false,
  showDebugOutline = false,
  showHintLabel = false,
  flash = false,
  hasUnread = false,
}: Props) {
  const spot = LOG_HOUSE_ROOM_MAILBOX_HOTSPOT;
  const box = LOG_HOUSE_ROOM_MAILBOX_PLACEMENT;
  const copy = LOG_HOUSE_ROOM_SPOT_COPY.mailbox;

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
      <span
        className="pointer-events-none absolute inset-0 flex items-end justify-center"
        aria-hidden
      >
        <span
          className={[
            "relative flex h-[88%] w-[70%] flex-col items-center justify-end",
            hasUnread ? "animate-pulse" : "",
          ].join(" ")}
          style={{
            marginLeft: `${((box.x - spot.x) / spot.width) * 100}%`,
          }}
        >
          {/* 仮ポスト：木箱＋差入口 */}
          <span className="relative h-full w-full rounded-md border border-[#6b5344]/70 bg-gradient-to-b from-[#c4a484] to-[#8d6b4f] shadow-sm">
            <span className="absolute inset-x-[18%] top-[22%] h-[14%] rounded-sm bg-[#5c4334]/85" />
            <span className="absolute inset-x-[28%] bottom-[18%] top-[42%] rounded-sm border border-[#5c4334]/35 bg-[#efe2d0]/35" />
          </span>
          {hasUnread ? (
            <span className="absolute -right-0.5 -top-1 text-[11px] drop-shadow-sm" title="未読">
              🌰
            </span>
          ) : null}
        </span>
      </span>

      {showHintLabel ? (
        <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span className="inline-block whitespace-nowrap rounded-full bg-[#fffdf9]/85 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-stone-700 shadow-sm ring-1 ring-stone-300/35">
            {copy.label}
          </span>
        </span>
      ) : null}
    </button>
  );
}
