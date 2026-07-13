"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  LOG_HOUSE_ROOM_MAILBOX_MAIL_SRC,
  LOG_HOUSE_ROOM_MAILBOX_SRC,
} from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_SPOT_COPY } from "@/lib/loghouse/logHouseRoomCopy";
import {
  LOG_HOUSE_ROOM_MAILBOX_HOTSPOT,
  LOG_HOUSE_ROOM_MAILBOX_VISUAL,
} from "@/lib/loghouse/logHouseMailboxLayout";

type Props = {
  onActivate: () => void;
  disabled?: boolean;
  showDebugOutline?: boolean;
  showHintLabel?: boolean;
  flash?: boolean;
  /** 未読があるとき、お手紙ありポスト画像を使う */
  hasUnread?: boolean;
};

const MAILBOX_SHAKE_SESSION_KEY = "ljd.loghouseRoom.mailboxUnreadShake.v1";

/** 玄関ポスト（靴の近く・未読で画像切替＋控えめな気づき演出） */
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
  const [shakeOnce, setShakeOnce] = useState(false);

  useEffect(() => {
    if (!hasUnread) {
      setShakeOnce(false);
      return;
    }
    try {
      if (window.sessionStorage.getItem(MAILBOX_SHAKE_SESSION_KEY) === "1") return;
      window.sessionStorage.setItem(MAILBOX_SHAKE_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setShakeOnce(true);
    const timer = window.setTimeout(() => setShakeOnce(false), 900);
    return () => window.clearTimeout(timer);
  }, [hasUnread]);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${copy.label}：${copy.description}${hasUnread ? "（お手紙あり）" : ""}`}
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
        className={[
          "pointer-events-none absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2",
          hasUnread ? "loghouse-mailbox-glow" : "",
          shakeOnce ? "loghouse-mailbox-shake" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: `${LOG_HOUSE_ROOM_MAILBOX_VISUAL.widthPctOfHotspot}%`,
          height: `${LOG_HOUSE_ROOM_MAILBOX_VISUAL.heightPctOfHotspot}%`,
        }}
        aria-hidden
      >
        <span className="relative block h-full w-full">
          <Image
            src={src}
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="28vw"
            unoptimized
            priority={hasUnread}
          />
        </span>
      </span>

      {showHintLabel ? (
        <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span className="inline-block max-w-[10rem] rounded-full bg-[#fffdf9]/85 px-2.5 py-0.5 text-center text-[10px] font-medium leading-snug tracking-wide text-stone-700 shadow-sm ring-1 ring-stone-300/35">
            {copy.label}
            <span className="mt-0.5 block font-normal text-stone-500">{copy.description}</span>
          </span>
        </span>
      ) : null}

      <style>{`
        .loghouse-mailbox-glow {
          filter: drop-shadow(0 0 7px rgba(242, 210, 140, 0.55))
            drop-shadow(0 0 14px rgba(232, 190, 110, 0.28));
        }
        .loghouse-mailbox-shake {
          animation: loghouse-mailbox-shake 0.85s ease-in-out 1;
        }
        @keyframes loghouse-mailbox-shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          18% { transform: translate(-50%, -50%) rotate(-3.5deg); }
          36% { transform: translate(-50%, -50%) rotate(3deg); }
          54% { transform: translate(-50%, -50%) rotate(-2deg); }
          72% { transform: translate(-50%, -50%) rotate(1.2deg); }
        }
      `}</style>
    </button>
  );
}
