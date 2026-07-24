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
  spotlight?: boolean;
  /** 案内中の強調度（tour は暗幕＋強い光） */
  spotlightIntensity?: "normal" | "tour";
  /** 案内中にスポットを暗幕より手前へ */
  elevateAboveDim?: boolean;
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
  spotlight = false,
  spotlightIntensity = "normal",
  elevateAboveDim = false,
  hasUnread = false,
}: Props) {
  const spot = LOG_HOUSE_ROOM_MAILBOX_HOTSPOT;
  const copy = LOG_HOUSE_ROOM_SPOT_COPY.mailbox;
  const tourBold = spotlight && spotlightIntensity === "tour";
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
        elevateAboveDim ? "absolute z-[26]" : "absolute z-[24]",
        "transition duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
        disabled
          ? "cursor-not-allowed opacity-40"
          : showDebugOutline
            ? "rounded-xl border-2 border-dashed border-blue-400/55 bg-blue-50/10"
            : "rounded-lg border-2 border-transparent hover:brightness-105 active:scale-[0.98]",
        flash || spotlight
          ? tourBold
            ? "brightness-125 drop-shadow-[0_0_22px_rgba(251,191,36,0.85)]"
            : "brightness-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]"
          : "",
        spotlight ? (tourBold ? "loghouse-mailbox-tour-pulse" : "animate-pulse") : "",
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
          hasUnread || spotlight ? (tourBold ? "loghouse-mailbox-glow-bold" : "loghouse-mailbox-glow") : "",
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
          {/* 通常／お手紙ありを両方先読みし、未読確定後の差替え待ちをなくす */}
          <Image
            src={LOG_HOUSE_ROOM_MAILBOX_SRC}
            alt=""
            fill
            className={[
              "object-contain object-bottom transition-opacity duration-150",
              hasUnread ? "opacity-0" : "opacity-100",
            ].join(" ")}
            sizes="28vw"
            unoptimized
            priority
          />
          <Image
            src={LOG_HOUSE_ROOM_MAILBOX_MAIL_SRC}
            alt=""
            fill
            className={[
              "object-contain object-bottom transition-opacity duration-150",
              hasUnread ? "opacity-100" : "opacity-0",
            ].join(" ")}
            sizes="28vw"
            unoptimized
            priority
          />
        </span>
      </span>

      {showHintLabel || spotlight ? (
        <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span
            className={[
              "inline-block whitespace-nowrap rounded-full text-center font-medium tracking-wide text-stone-800 shadow-md ring-1 ring-amber-200/70",
              tourBold
                ? "bg-[#fffdf9]/95 px-3 py-1 text-[11px]"
                : "bg-[#fffdf9]/85 px-2.5 py-0.5 text-[10px] text-stone-700 ring-stone-300/35",
            ].join(" ")}
          >
            {copy.label}
          </span>
        </span>
      ) : null}

      <style>{`
        .loghouse-mailbox-glow {
          filter: drop-shadow(0 0 7px rgba(242, 210, 140, 0.55))
            drop-shadow(0 0 14px rgba(232, 190, 110, 0.28));
        }
        .loghouse-mailbox-glow-bold {
          filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.85))
            drop-shadow(0 0 22px rgba(245, 158, 11, 0.55));
        }
        .loghouse-mailbox-tour-pulse {
          animation: loghouse-mailbox-tour-pulse 1.35s ease-in-out infinite;
        }
        @keyframes loghouse-mailbox-tour-pulse {
          0%, 100% { filter: brightness(1.1); }
          50% { filter: brightness(1.28); }
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
