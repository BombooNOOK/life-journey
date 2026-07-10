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
