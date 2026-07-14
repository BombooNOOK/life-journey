"use client";

import { LOG_HOUSE_ROOM_PART_PLACEMENTS } from "@/lib/loghouse/logHouseRoomLayout";

type Props = {
  active: boolean;
};

/**
 * ログハウス室内：再生中だけラジカセの“上空”に気配を出す。
 * 本体の模様に埋もれないよう、ラジカセの上〜外側に出す。
 */
export function LogHouseRadioPlayingAura({ active }: Props) {
  const radio = LOG_HOUSE_ROOM_PART_PLACEMENTS.find((p) => p.id === "radio");
  if (!radio || !active) return null;

  return (
    <div
      className="pointer-events-none absolute z-[28] overflow-visible"
      style={{
        left: `${radio.x}%`,
        top: `${radio.y}%`,
        width: `${radio.width}%`,
        height: `${radio.height}%`,
      }}
      aria-hidden
    >
      {/* ラジカセ上のほんのり光る空気 */}
      <span
        className="absolute left-[10%] right-[8%] top-[-42%] h-[58%] rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 50% 70%, rgba(255, 214, 140, 0.55) 0%, rgba(255, 214, 140, 0.12) 48%, transparent 72%)",
        }}
      />

      {/* 天板付近のランプ（ゴールドの点） */}
      <span className="loghouse-radio-lamp absolute right-[22%] top-[6%] h-2.5 w-2.5 rounded-full bg-[#ffe09a] shadow-[0_0_12px_4px_rgba(255,200,110,0.75)]" />

      {/* 上空にふわっと浮かぶ音符（本体の模様の上ではなく、はっきり見える位置） */}
      <span className="loghouse-radio-note absolute left-[18%] top-[-38%] text-[1.05rem] leading-none text-[#f7f0dc] drop-shadow-[0_1px_1px_rgba(55,40,20,0.55)]">
        ♪
      </span>
      <span className="loghouse-radio-note-delay absolute left-[48%] top-[-52%] text-[0.9rem] leading-none text-[#efe4c4] drop-shadow-[0_1px_1px_rgba(55,40,20,0.5)]">
        ♫
      </span>
      <span className="loghouse-radio-note-delay-2 absolute left-[70%] top-[-28%] text-[0.8rem] leading-none text-[#f4ecd4]/95 drop-shadow-[0_1px_1px_rgba(55,40,20,0.45)]">
        ♪
      </span>
    </div>
  );
}
