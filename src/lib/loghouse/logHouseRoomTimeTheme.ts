/**
 * ログハウス室内の時間帯テーマ（端末ローカル時刻 + 表示設定の好み）。
 * 将来の季節バリエーションは timeOfDay とは別軸で足せる想定。
 */

export type LogHouseRoomTimeOfDay = "day" | "night";

/** 自動 / 昼固定 / 夜固定（デフォルトは自動） */
export type LogHouseRoomTimeThemePreference = "auto" | LogHouseRoomTimeOfDay;

export const LOG_HOUSE_ROOM_TIME_THEME_PREFERENCES = ["auto", "day", "night"] as const;

export const DEFAULT_LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE: LogHouseRoomTimeThemePreference =
  "auto";

export const LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_STORAGE_KEY =
  "ljd.loghouseRoom.timeTheme.v1" as const;

export const LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_LABELS: Record<
  LogHouseRoomTimeThemePreference,
  string
> = {
  auto: "自動",
  day: "昼",
  night: "夜",
};

/** 昼の開始時刻（この時以降は昼）。仮ルール：5:00〜17:59 */
export const LOG_HOUSE_ROOM_DAY_START_HOUR = 5 as const;

/** 夜の開始時刻（この時以降は夜）。仮ルール：18:00〜4:59 */
export const LOG_HOUSE_ROOM_NIGHT_START_HOUR = 18 as const;

/** 開きっぱなし時の再判定間隔（軽量） */
export const LOG_HOUSE_ROOM_TIME_THEME_POLL_MS = 60_000 as const;

/**
 * 端末ローカル時刻から昼 / 夜を返す。
 * @param now テスト用。省略時は `new Date()`
 */
export function getLogHouseRoomTimeOfDay(now: Date = new Date()): LogHouseRoomTimeOfDay {
  const hour = now.getHours();
  if (hour >= LOG_HOUSE_ROOM_NIGHT_START_HOUR || hour < LOG_HOUSE_ROOM_DAY_START_HOUR) {
    return "night";
  }
  return "day";
}

/** @see getLogHouseRoomTimeOfDay — 呼び出し側の短い別名 */
export function getLogHouseTimeTheme(now?: Date): LogHouseRoomTimeOfDay {
  return getLogHouseRoomTimeOfDay(now);
}

export function normalizeLogHouseRoomTimeThemePreference(
  value: unknown,
): LogHouseRoomTimeThemePreference {
  if (value === "day" || value === "night" || value === "auto") return value;
  return DEFAULT_LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE;
}

/** 表示設定の好みを反映した実際の昼/夜 */
export function resolveLogHouseRoomTimeOfDay(
  preference: LogHouseRoomTimeThemePreference,
  now: Date = new Date(),
): LogHouseRoomTimeOfDay {
  if (preference === "day" || preference === "night") return preference;
  return getLogHouseRoomTimeOfDay(now);
}
