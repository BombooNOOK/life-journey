"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import {
  LOG_HOUSE_ROOM_RABBIT_GREETING,
  LOG_HOUSE_ROOM_SPOT_COPY,
} from "@/lib/loghouse/logHouseRoomCopy";
import { LOG_HOUSE_ROOM_RABBIT_SRC } from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_RABBIT_PLACEMENT } from "@/lib/loghouse/logHouseRoomLayout";

type Props = {
  className?: string;
};

/** ログハウス室内の分身うさぎ（idle + タップ反応） */
export function LogHouseRoomRabbitAvatar({ className = "" }: Props) {
  const [showBubble, setShowBubble] = useState(false);
  const [bounce, setBounce] = useState(false);

  const placement = LOG_HOUSE_ROOM_RABBIT_PLACEMENT;

  const handleTap = useCallback(() => {
    setShowBubble((prev) => !prev);
    setBounce(true);
    window.setTimeout(() => setBounce(false), 280);
  }, []);

  return (
    <button
      type="button"
      aria-label="うさぎさん"
      onClick={handleTap}
      className={[
        "absolute transition-transform duration-200 ease-out",
        bounce ? "scale-105 -translate-y-1" : "animate-[loghouseRabbitIdle_3.5s_ease-in-out_infinite]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        height: `${placement.height}%`,
        zIndex: placement.zIndex,
      }}
    >
      {showBubble ? (
        <span
          className="absolute -top-9 left-1/2 z-30 w-max max-w-[10rem] -translate-x-1/2 rounded-xl border border-emerald-100 bg-white/95 px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-stone-700 shadow-sm"
          role="status"
        >
          {LOG_HOUSE_ROOM_RABBIT_GREETING}
        </span>
      ) : null}
      <Image
        src={LOG_HOUSE_ROOM_RABBIT_SRC}
        alt=""
        fill
        className="object-contain object-center drop-shadow-[0_4px_12px_rgba(74,55,40,0.18)]"
        sizes="28vw"
        unoptimized
      />
      <span className="sr-only">{LOG_HOUSE_ROOM_SPOT_COPY.residentCard.label}</span>
    </button>
  );
}
