import type { LogHouseRoomSpotId } from "@/lib/loghouse/logHouseRoomHotspots";

export type LogHouseRoomSpotCopy = {
  label: string;
  description: string;
};

export const LOG_HOUSE_ROOM_SPOT_COPY: Record<LogHouseRoomSpotId, LogHouseRoomSpotCopy> = {
  bookshelf: {
    label: "本棚",
    description: "鑑定書や日記を見返す",
  },
  desk: {
    label: "机",
    description: "今日の日記を書く",
  },
  residentCard: {
    label: "森の住民票",
    description: "あなたの住民票を見る",
  },
  todayResult: {
    label: "今日の鑑定結果",
    description: "今日のヒントを見る",
  },
  radio: {
    label: "森の音",
    description: "音楽や自然音を聴く",
  },
};

export const LOG_HOUSE_ROOM_RABBIT_GREETING = "今日も森へようこそ";

export const LOG_HOUSE_ROOM_MANAGE_BUTTON_LABEL = "その他";

/** 歯車：設定・管理 */
export const LOG_HOUSE_SETTINGS_BUTTON_LABEL = "設定" as const;

/** ハンバーガー：森の入口へワンタップ */
export const LOG_HOUSE_FOREST_ENTRANCE_LABEL = "森の入口（トップ）" as const;
export const LOG_HOUSE_FOREST_ENTRANCE_HREF = "/" as const;

/** 地図アイコン：森の案内図 */
export const LOG_HOUSE_FOREST_MAP_LABEL = "森の案内図" as const;
export const LOG_HOUSE_FOREST_MAP_HREF = "/help/ljd#forest-guide-map-heading" as const;
