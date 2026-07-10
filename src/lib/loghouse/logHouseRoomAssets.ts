/** ログハウス室内UI（スマホ縦長）— 画像パス */

export const LOG_HOUSE_ROOM_ASSET_DIR = "/images/ljd/loghouse-room" as const;

const LOG_HOUSE_ROOM_ASSET_VERSION = 6;

function logHouseRoomAsset(filename: string): string {
  return `${LOG_HOUSE_ROOM_ASSET_DIR}/${filename}?v=${LOG_HOUSE_ROOM_ASSET_VERSION}`;
}

/** 縦長室内背景（576×1024） */
export const LOG_HOUSE_ROOM_MOBILE_BG_SRC = logHouseRoomAsset("loghouse_room_mobile.png");

export const LOG_HOUSE_ROOM_MOBILE_INTRINSIC = { widthPx: 576, heightPx: 1024 } as const;

/** 座標合わせ用サンプル（開発参照） */
export const LOG_HOUSE_ROOM_SAMPLE_ALL_PARTS_SRC = logHouseRoomAsset(
  "loghouse_room_sample_all_parts.png",
);

export type LogHouseRoomPartId =
  | "bookshelf"
  | "chair"
  | "desk"
  | "residentCard"
  | "todayResult"
  | "radio"
  | "rabbit";

export const LOG_HOUSE_ROOM_PART_SRC: Record<LogHouseRoomPartId, string> = {
  bookshelf: logHouseRoomAsset("loghouse_bookshelf.png"),
  chair: logHouseRoomAsset("loghouse_chair.png"),
  desk: logHouseRoomAsset("loghouse_desk.png"),
  residentCard: logHouseRoomAsset("loghouse_resident_card.png"),
  todayResult: logHouseRoomAsset("loghouse_today_result.png"),
  radio: logHouseRoomAsset("loghouse_radio.png"),
  rabbit: logHouseRoomAsset("loghouse_rabbit.png"),
};

/** 書き出し元の実ピクセル（アスペクト比維持用） */
export const LOG_HOUSE_ROOM_PART_INTRINSIC: Record<
  LogHouseRoomPartId,
  { widthPx: number; heightPx: number }
> = {
  bookshelf: { widthPx: 485, heightPx: 719 },
  chair: { widthPx: 679, heightPx: 581 },
  desk: { widthPx: 720, heightPx: 720 },
  residentCard: { widthPx: 720, heightPx: 720 },
  todayResult: { widthPx: 720, heightPx: 720 },
  radio: { widthPx: 629, heightPx: 488 },
  rabbit: { widthPx: 385, heightPx: 720 },
};

export const LOG_HOUSE_ROOM_RABBIT_SRC = LOG_HOUSE_ROOM_PART_SRC.rabbit;

export const LOG_HOUSE_ROOM_RABBIT_INTRINSIC = LOG_HOUSE_ROOM_PART_INTRINSIC.rabbit;

/** 分身うさぎ：立ち／瞬き／歩き（左右） */
export const LOG_HOUSE_ROOM_RABBIT_POSE_SRC = {
  idle: LOG_HOUSE_ROOM_RABBIT_SRC,
  blink: logHouseRoomAsset("loghouse_rabbit_blink.png"),
  walkLeft: logHouseRoomAsset("loghouse_rabbit_walk_left.png"),
  walkRight: logHouseRoomAsset("loghouse_rabbit_walk_right.png"),
} as const;

export type LogHouseRoomRabbitPose = keyof typeof LOG_HOUSE_ROOM_RABBIT_POSE_SRC;
