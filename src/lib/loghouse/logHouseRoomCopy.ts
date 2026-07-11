import type { LogHouseRoomSpotId } from "@/lib/loghouse/logHouseRoomHotspots";

export type LogHouseRoomSpotCopy = {
  label: string;
  description: string;
  /** 説明シートの遷移ボタン */
  actionLabel: string;
};

export const LOG_HOUSE_ROOM_SPOT_COPY: Record<LogHouseRoomSpotId, LogHouseRoomSpotCopy> = {
  bookshelf: {
    label: "本棚",
    description: "鑑定書や日記を見返す",
    actionLabel: "本棚を開く",
  },
  desk: {
    label: "机",
    description: "今日の日記を書く",
    actionLabel: "日記を書く",
  },
  residentCard: {
    label: "森の住民票",
    description: "あなたの住民票を見る",
    actionLabel: "住民票を見る",
  },
  todayResult: {
    label: "今日の鑑定結果",
    description: "今日のヒントを見る",
    actionLabel: "今日の結果を見る",
  },
  radio: {
    label: "森の音",
    description: "音楽や自然音を聴く",
    actionLabel: "音楽堂を開く",
  },
};

export const LOG_HOUSE_ROOM_RABBIT_GREETING = "今日も森へようこそ";

/** 鑑定前に本棚・机・今日の鑑定結果をタップしたとき */
export const LOG_HOUSE_ROOM_KANTEI_LOCK_MESSAGE =
  "無料鑑定が終わると、ここから使えるようになります。" as const;

export const LOG_HOUSE_ROOM_JOURNAL_LOCK_MESSAGE =
  "いまは日記を書けない状態です。アカウント設定をご確認ください。" as const;

export const LOG_HOUSE_ROOM_MANAGE_BUTTON_LABEL = "その他";

/** 歯車：設定・管理 */
export const LOG_HOUSE_SETTINGS_BUTTON_LABEL = "設定" as const;

/** ハンバーガー：森の入口へワンタップ */
export const LOG_HOUSE_FOREST_ENTRANCE_LABEL = "森の入口（トップ）" as const;
export const LOG_HOUSE_FOREST_ENTRANCE_HREF = "/" as const;

/** 地図アイコン：森の案内図（単独ページ） */
export const LOG_HOUSE_FOREST_MAP_LABEL = "森の案内図" as const;
export const LOG_HOUSE_FOREST_MAP_HREF = "/help/forest-map?returnTo=%2Forders" as const;

/** タップ箇所ヒント（？） */
export const LOG_HOUSE_ROOM_HINT_BUTTON_LABEL = "タップできる場所を見る" as const;
export const LOG_HOUSE_ROOM_HINT_HIDE_LABEL = "ヒントを閉じる" as const;
export const LOG_HOUSE_ROOM_HINT_AUTO_HIDE_MS = 6500 as const;

/** 初回ログハウス案内 */
export const LOG_HOUSE_ROOM_FIRST_VISIT_TIP =
  "ログハウスでは、本棚や机をタップできます。\n迷ったら、？を押してみてください。" as const;
export const LOG_HOUSE_ROOM_FIRST_VISIT_TIP_STORAGE_KEY =
  "ljd.loghouseRoom.tapHintIntroSeen.v1" as const;
