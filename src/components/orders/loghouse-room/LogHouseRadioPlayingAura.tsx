"use client";

import { LOG_HOUSE_ROOM_PART_PLACEMENTS } from "@/lib/loghouse/logHouseRoomLayout";

type Props = {
  active: boolean;
};

/**
 * ログハウス室内：再生中だけラジカセ本体のすぐ近くに気配を出す。
 * （今日の鑑定結果まで上がらないよう、高さを抑える）
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
      {/* ラジカセすぐ上〜取っ手周辺の音符だけ（ランプ点は使わない） */}
      <span className="loghouse-radio-note absolute left-[22%] top-[-6%] text-[0.95rem] leading-none text-[#f7f0dc] drop-shadow-[0_1px_1px_rgba(55,40,20,0.55)]">
        ♪
      </span>
      <span className="loghouse-radio-note-delay absolute left-[52%] top-[-12%] text-[0.82rem] leading-none text-[#efe4c4] drop-shadow-[0_1px_1px_rgba(55,40,20,0.5)]">
        ♫
      </span>
      <span className="loghouse-radio-note-delay-2 absolute left-[74%] top-[2%] text-[0.72rem] leading-none text-[#f4ecd4]/95 drop-shadow-[0_1px_1px_rgba(55,40,20,0.45)]">
        ♪
      </span>
    </div>
  );
}
