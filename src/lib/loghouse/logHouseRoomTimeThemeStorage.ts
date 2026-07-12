import {
  LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_STORAGE_KEY,
  normalizeLogHouseRoomTimeThemePreference,
  type LogHouseRoomTimeThemePreference,
} from "@/lib/loghouse/logHouseRoomTimeTheme";

export function readLogHouseRoomTimeThemePreferenceFromStorage(): LogHouseRoomTimeThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeLogHouseRoomTimeThemePreference(raw);
  } catch {
    return null;
  }
}

export function writeLogHouseRoomTimeThemePreferenceToStorage(
  preference: LogHouseRoomTimeThemePreference,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    /* quota / private mode */
  }
}
