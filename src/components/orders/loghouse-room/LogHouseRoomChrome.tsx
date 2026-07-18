"use client";

import Link from "next/link";

import { LogHouseDonguriCapsule } from "@/components/orders/loghouse-room/LogHouseDonguriCapsule";
import {
  LOG_HOUSE_FOREST_MAP_HREF,
  LOG_HOUSE_FOREST_MAP_LABEL,
  LOG_HOUSE_ROOM_HINT_BUTTON_LABEL,
  LOG_HOUSE_ROOM_HINT_HIDE_LABEL,
  LOG_HOUSE_SETTINGS_BUTTON_LABEL,
} from "@/lib/loghouse/logHouseRoomCopy";

type Props = {
  onOpenSettings: () => void;
  hintActive?: boolean;
  onToggleHint?: () => void;
  /** はじめて案内：？ボタンを光らせる */
  hintSpotlight?: boolean;
  /** 夜背景時はアイコンの下地を少し濃くして可読性を保つ */
  timeOfDay?: "day" | "night";
  donguriBalance?: number;
  onOpenDonguriCho?: () => void;
};

function GearIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10c0 .7.4 1.3 1 1.5H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5 3.75 6.75v12.75L9 17.25m0-12.75 6 3m-6-3v12.75m6-9.75 5.25-2.25v12.75L15 20.25m0-12.75v12.75"
      />
    </svg>
  );
}

function HintIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 2-2.9 2.5-2.9 4.3"
      />
      <circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}

const chromeButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-500/20 bg-[#fffdf9]/55 text-stone-700 shadow-sm backdrop-blur-[3px] transition hover:bg-[#fffdf9]/75 active:scale-[0.98]";

const chromeButtonNightClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200/35 bg-[#fffdf9]/82 text-stone-800 shadow-md backdrop-blur-[3px] transition hover:bg-[#fffdf9]/92 active:scale-[0.98]";

/** 没入ログハウス：地図・どんぐり・？・設定 */
export function LogHouseRoomChrome({
  onOpenSettings,
  hintActive = false,
  onToggleHint,
  hintSpotlight = false,
  timeOfDay = "day",
  donguriBalance = 0,
  onOpenDonguriCho,
}: Props) {
  const buttonClass = timeOfDay === "night" ? chromeButtonNightClass : chromeButtonClass;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-start gap-2">
        <Link
          href={LOG_HOUSE_FOREST_MAP_HREF}
          className={buttonClass}
          aria-label={LOG_HOUSE_FOREST_MAP_LABEL}
          title={LOG_HOUSE_FOREST_MAP_LABEL}
        >
          <MapIcon />
        </Link>
        {onOpenDonguriCho ? (
          <LogHouseDonguriCapsule
            balance={donguriBalance}
            onOpen={onOpenDonguriCho}
            timeOfDay={timeOfDay}
          />
        ) : null}
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {onToggleHint ? (
          <button
            type="button"
            className={[
              buttonClass,
              hintActive || hintSpotlight
                ? "border-emerald-400/50 bg-emerald-50/80 text-emerald-900"
                : "",
              hintSpotlight ? "animate-pulse ring-2 ring-amber-300/70" : "",
            ].join(" ")}
            aria-pressed={hintActive}
            aria-label={hintActive ? LOG_HOUSE_ROOM_HINT_HIDE_LABEL : LOG_HOUSE_ROOM_HINT_BUTTON_LABEL}
            title={hintActive ? LOG_HOUSE_ROOM_HINT_HIDE_LABEL : LOG_HOUSE_ROOM_HINT_BUTTON_LABEL}
            onClick={onToggleHint}
          >
            <HintIcon />
          </button>
        ) : null}
        <button
          type="button"
          className={buttonClass}
          aria-label={`${LOG_HOUSE_SETTINGS_BUTTON_LABEL}を開く`}
          title={LOG_HOUSE_SETTINGS_BUTTON_LABEL}
          onClick={onOpenSettings}
        >
          <GearIcon />
        </button>
      </div>
    </div>
  );
}
