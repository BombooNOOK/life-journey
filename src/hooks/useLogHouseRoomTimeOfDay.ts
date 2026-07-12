"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE,
  getLogHouseRoomTimeOfDay,
  LOG_HOUSE_ROOM_TIME_THEME_POLL_MS,
  LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_STORAGE_KEY,
  type LogHouseRoomTimeOfDay,
  type LogHouseRoomTimeThemePreference,
} from "@/lib/loghouse/logHouseRoomTimeTheme";
import {
  readLogHouseRoomTimeThemePreferenceFromStorage,
  writeLogHouseRoomTimeThemePreferenceToStorage,
} from "@/lib/loghouse/logHouseRoomTimeThemeStorage";

const PREFERENCE_CHANGE_EVENT = "ljd:loghouse-time-theme-preference";

function subscribeClock(onStoreChange: () => void) {
  const refresh = () => onStoreChange();
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  const timer = window.setInterval(refresh, LOG_HOUSE_ROOM_TIME_THEME_POLL_MS);
  return () => {
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
    window.clearInterval(timer);
  };
}

function getClockSnapshot(): LogHouseRoomTimeOfDay {
  return getLogHouseRoomTimeOfDay();
}

function getClockServerSnapshot(): LogHouseRoomTimeOfDay {
  return "day";
}

function subscribePreference(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE_STORAGE_KEY
    ) {
      onStoreChange();
    }
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFERENCE_CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFERENCE_CHANGE_EVENT, onCustom);
  };
}

function getPreferenceSnapshot(): LogHouseRoomTimeThemePreference {
  return (
    readLogHouseRoomTimeThemePreferenceFromStorage() ??
    DEFAULT_LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE
  );
}

function getPreferenceServerSnapshot(): LogHouseRoomTimeThemePreference {
  return DEFAULT_LOG_HOUSE_ROOM_TIME_THEME_PREFERENCE;
}

function notifyPreferenceListeners() {
  window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
}

/** 端末ローカル時刻の昼/夜（自動判定のみ） */
export function useLogHouseRoomTimeOfDay(): LogHouseRoomTimeOfDay {
  return useSyncExternalStore(subscribeClock, getClockSnapshot, getClockServerSnapshot);
}

/** 表示設定の好み + 実際に使う昼/夜 */
export function useLogHouseRoomTimeTheme() {
  const preference = useSyncExternalStore(
    subscribePreference,
    getPreferenceSnapshot,
    getPreferenceServerSnapshot,
  );
  const autoTimeOfDay = useLogHouseRoomTimeOfDay();
  const timeOfDay: LogHouseRoomTimeOfDay =
    preference === "auto" ? autoTimeOfDay : preference;

  const setPreference = useCallback((next: LogHouseRoomTimeThemePreference) => {
    writeLogHouseRoomTimeThemePreferenceToStorage(next);
    notifyPreferenceListeners();
  }, []);

  return { preference, setPreference, timeOfDay };
}
