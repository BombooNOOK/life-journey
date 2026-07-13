/** ログハウス室内 — 家具タップ領域（576×1024 設計・%） */

export type LogHouseRoomSpotId =
  | "bookshelf"
  | "desk"
  | "residentCard"
  | "todayResult"
  | "radio"
  | "goOut";

export type LogHouseRoomHintLabelAlign = "center" | "start" | "end";

/** ヒントラベルの縦位置（デフォルトはホットスポット内の下端） */
export type LogHouseRoomHintLabelEdge = "inside-bottom" | "inside-top" | "above" | "below";

export type LogHouseRoomHotspot = {
  id: LogHouseRoomSpotId;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * ヒントラベルの寄せ。
   * 端の家具は画面外切れを避けるため start/end（中央寄りに伸ばす）を使う。
   */
  hintLabelAlign?: LogHouseRoomHintLabelAlign;
  hintLabelEdge?: LogHouseRoomHintLabelEdge;
};

/** パーツ画像に合わせたタップ領域 */
export const LOG_HOUSE_ROOM_HOTSPOTS: LogHouseRoomHotspot[] = [
  { id: "bookshelf", x: 4.6, y: 27, width: 41.4, height: 31.1, hintLabelAlign: "start" },
  /** 開いた日記付近にヒントが出るよう上端寄せ。タップは机全体をカバー */
  {
    id: "desk",
    x: 50,
    y: 29,
    width: 46,
    height: 26,
    hintLabelAlign: "center",
    hintLabelEdge: "inside-top",
  },
  { id: "residentCard", x: 22.1, y: 14.9, width: 19, height: 10.1 },
  { id: "todayResult", x: 70.7, y: 60.5, width: 25.6, height: 14.5, hintLabelAlign: "end" },
  { id: "radio", x: 59.2, y: 80.8, width: 21.8, height: 10.7, hintLabelAlign: "end" },
];

/** 玄関の靴（おでかけ導線）— 576×1024 設計・% */
export const LOG_HOUSE_ROOM_GO_OUT_HOTSPOT: LogHouseRoomHotspot = {
  id: "goOut",
  x: 36,
  y: 91.8,
  width: 28,
  height: 7.8,
  hintLabelAlign: "center",
  /** 靴の下にヒントを出す */
  hintLabelEdge: "below",
};
