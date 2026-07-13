/** 玄関ポスト（靴の左）— 576×1024 設計・% */

/** 見た目サイズ（1.4倍前後） */
export const LOG_HOUSE_ROOM_MAILBOX_VISUAL = {
  widthPctOfHotspot: 72,
  heightPctOfHotspot: 78,
} as const;

/**
 * タップ領域（見た目より広め・最低でも押しやすいサイズ）。
 * 旧: x16 y87.5 w20 h11.5 → 約1.4倍＋余白
 */
export const LOG_HOUSE_ROOM_MAILBOX_HOTSPOT = {
  id: "mailbox" as const,
  x: 12.5,
  y: 84.5,
  width: 27,
  height: 15.5,
  hintLabelAlign: "center" as const,
  hintLabelEdge: "inside-top" as const,
};

/** @deprecated visual は HOTSPOT 内に収める。互換用に残置 */
export const LOG_HOUSE_ROOM_MAILBOX_PLACEMENT = {
  x: 16,
  y: 87,
  width: 20,
  height: 13,
  zIndex: 22,
} as const;
