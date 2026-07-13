/** 玄関ポスト（靴の左）— 576×1024 設計・% */

/**
 * 見た目サイズ（ホットスポットに対する％）。
 * 以前は見た目をホットスポットの約7割に抑えており、拡大が相殺されていたため、
 * ほぼ埋める比率にして実質約1.3倍になるよう調整。
 */
export const LOG_HOUSE_ROOM_MAILBOX_VISUAL = {
  widthPctOfHotspot: 92,
  heightPctOfHotspot: 94,
} as const;

/**
 * タップ領域（見た目より少し広め）。
 * 実効の見た目サイズ ≈ w×0.92 / h×0.94 → 画面比で約 26% × 16%（旧実効の約1.3倍）
 */
export const LOG_HOUSE_ROOM_MAILBOX_HOTSPOT = {
  id: "mailbox" as const,
  x: 11.5,
  y: 83,
  width: 28.5,
  height: 17,
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
