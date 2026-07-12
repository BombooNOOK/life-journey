"use client";

import {
  LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_LABELS,
  LOG_HOUSE_ROOM_TIME_THEME_PREFERENCES,
  type LogHouseRoomTimeThemePreference,
} from "@/lib/loghouse/logHouseRoomTimeTheme";
import { useLogHouseRoomTimeTheme } from "@/hooks/useLogHouseRoomTimeOfDay";

function optionClass(active: boolean): string {
  return [
    "min-h-[40px] flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold leading-tight transition sm:min-h-[44px] sm:text-xs",
    active
      ? "border-emerald-700 bg-emerald-800 text-white shadow-sm"
      : "border-stone-300/90 bg-white/90 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/80",
  ].join(" ");
}

/** ログハウス室内の昼/夜（自動・固定） */
export function LogHouseRoomTimeThemeControl({ className = "" }: { className?: string }) {
  const { preference, setPreference, timeOfDay } = useLogHouseRoomTimeTheme();

  return (
    <div
      className={["w-full", className].filter(Boolean).join(" ")}
      role="group"
      aria-label="ログハウスの時間帯"
    >
      <p className="lj-read-desc text-sm text-stone-600">ログハウスの時間帯</p>
      <div className="mt-3 flex gap-2">
        {LOG_HOUSE_ROOM_TIME_THEME_PREFERENCES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={preference === value}
            onClick={() => setPreference(value as LogHouseRoomTimeThemePreference)}
            className={optionClass(preference === value)}
          >
            {LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_LABELS[value]}
          </button>
        ))}
      </div>
      <p className="lj-read-caption mt-2 text-stone-500">
        現在：
        {LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_LABELS[preference]}
        {preference === "auto"
          ? `（いまは${LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_LABELS[timeOfDay]}）`
          : null}
        。ログハウス室内の背景に反映されます。
      </p>
    </div>
  );
}
