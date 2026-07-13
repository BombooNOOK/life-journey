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

export const LOG_HOUSE_ROOM_SHOES_PLACEMENT = {
  x: 38,
  y: 92,
  width: 24,
  height: 7.2,
  zIndex: 21,
  objectPosition: "center bottom",
} as const;

export const LOG_HOUSE_ROOM_RABBIT_PLACEMENT = {
  x: 38,
  /** 足元がじゅうたん中央付近になるよう配置（height 34 → 足元 y≈70） */
  y: 36,
  width: 22,
  height: 34,
  /** 椅子(20)より奥。ラグ上に立つ想定 */
  zIndex: 18,
} as const;

/**
 * うさぎの「足元」が動ける範囲（部屋 %・楕円）。
 * 下側は椅子・机にめり込まないよう短め（足元の最大おおよそ y=76）。
 */
export const LOG_HOUSE_ROOM_RABBIT_RUG = {
  centerX: 48,
  centerY: 70,
  radiusX: 15,
  /** 上方向（奥）は広め、下方向（手前）は椅子前で切る */
  radiusYUp: 8,
  radiusYDown: 6,
} as const;

export type LogHouseRoomPoint = { x: number; y: number };

/** 配置ボックス左上 → 足元（ボックス下辺中央） */
export function logHouseRoomRabbitFeetFromPlacement(placement: LogHouseRoomPoint): LogHouseRoomPoint {
  return {
    x: placement.x + LOG_HOUSE_ROOM_RABBIT_PLACEMENT.width / 2,
    y: placement.y + LOG_HOUSE_ROOM_RABBIT_PLACEMENT.height,
  };
}

/** 足元 → 配置ボックス左上 */
export function logHouseRoomRabbitPlacementFromFeet(feet: LogHouseRoomPoint): LogHouseRoomPoint {
  return {
    x: feet.x - LOG_HOUSE_ROOM_RABBIT_PLACEMENT.width / 2,
    y: feet.y - LOG_HOUSE_ROOM_RABBIT_PLACEMENT.height,
  };
}

export function logHouseRoomRabbitFeetOnRug(feet: LogHouseRoomPoint): boolean {
  const { centerX, centerY, radiusX, radiusYUp, radiusYDown } = LOG_HOUSE_ROOM_RABBIT_RUG;
  const nx = (feet.x - centerX) / radiusX;
  const radiusY = feet.y >= centerY ? radiusYDown : radiusYUp;
  const ny = (feet.y - centerY) / radiusY;
  return nx * nx + ny * ny <= 1;
}

/** じゅうたん上のランダムな足元（現在地からある程度離す） */
export function pickLogHouseRoomRabbitFeetOnRug(
  currentFeet: LogHouseRoomPoint,
  minDistance = 5,
): LogHouseRoomPoint {
  const { centerX, centerY, radiusX, radiusYUp, radiusYDown } = LOG_HOUSE_ROOM_RABBIT_RUG;
  let best = currentFeet;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random());
    const radiusY = Math.sin(angle) >= 0 ? radiusYDown : radiusYUp;
    const next = {
      x: centerX + Math.cos(angle) * radiusX * radius,
      y: centerY + Math.sin(angle) * radiusY * radius,
    };
    if (Math.hypot(next.x - currentFeet.x, next.y - currentFeet.y) >= minDistance) {
      return next;
    }
    best = next;
  }

  return best;
}

/** 初期立ち位置の互換（足元はじゅうたん上） */
export const LOG_HOUSE_ROOM_RABBIT_WAYPOINTS = [
  {
    x: LOG_HOUSE_ROOM_RABBIT_PLACEMENT.x,
    y: LOG_HOUSE_ROOM_RABBIT_PLACEMENT.y,
  },
] as const;
