import type { LogHouseRoomPartId } from "@/lib/loghouse/logHouseRoomAssets";

/** ログハウス室内 — パーツ重ね配置（576×1024 設計・%） */

export type LogHouseRoomPartPlacement = {
  id: LogHouseRoomPartId;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  /** CSS object-position（例: left bottom） */
  objectPosition?: string;
};

/** 奥 → 手前（loghouse_room_sample_all_parts.png に合わせた %） */
export const LOG_HOUSE_ROOM_PART_PLACEMENTS: LogHouseRoomPartPlacement[] = [
  { id: "bookshelf", x: 2.6, y: -6.7, width: 46, height: 66.7, zIndex: 5, objectPosition: "left bottom" },
  { id: "chair", x: -3.5, y: 56.2, width: 62.4, height: 36, zIndex: 20, objectPosition: "left bottom" },
  { id: "desk", x: 48, y: 28.2, width: 50, height: 36, zIndex: 10, objectPosition: "right bottom" },
  { id: "residentCard", x: 21, y: 13.9, width: 21.3, height: 11.2, zIndex: 12, objectPosition: "center top" },
  { id: "todayResult", x: 69.1, y: 54.6, width: 28.8, height: 22.4, zIndex: 14, objectPosition: "center bottom" },
  { id: "radio", x: 57.2, y: 77.7, width: 27.7, height: 15.1, zIndex: 19, objectPosition: "right bottom" },
];

export const LOG_HOUSE_ROOM_RABBIT_PLACEMENT = {
  x: 38,
  y: 48,
  width: 22,
  height: 34,
  zIndex: 18,
} as const;
