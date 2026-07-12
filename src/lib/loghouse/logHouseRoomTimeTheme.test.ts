import { describe, expect, it } from "vitest";

import {
  getLogHouseRoomTimeOfDay,
  LOG_HOUSE_ROOM_DAY_START_HOUR,
  LOG_HOUSE_ROOM_NIGHT_START_HOUR,
  normalizeLogHouseRoomTimeThemePreference,
  resolveLogHouseRoomTimeOfDay,
} from "@/lib/loghouse/logHouseRoomTimeTheme";

function atHour(hour: number, minute = 0): Date {
  return new Date(2026, 6, 12, hour, minute, 0, 0);
}

describe("getLogHouseRoomTimeOfDay", () => {
  it("returns day from day start through the hour before night", () => {
    expect(getLogHouseRoomTimeOfDay(atHour(LOG_HOUSE_ROOM_DAY_START_HOUR))).toBe("day");
    expect(getLogHouseRoomTimeOfDay(atHour(12))).toBe("day");
    expect(getLogHouseRoomTimeOfDay(atHour(LOG_HOUSE_ROOM_NIGHT_START_HOUR - 1, 59))).toBe("day");
  });

  it("returns night from night start until before day start", () => {
    expect(getLogHouseRoomTimeOfDay(atHour(LOG_HOUSE_ROOM_NIGHT_START_HOUR))).toBe("night");
    expect(getLogHouseRoomTimeOfDay(atHour(23, 30))).toBe("night");
    expect(getLogHouseRoomTimeOfDay(atHour(0))).toBe("night");
    expect(getLogHouseRoomTimeOfDay(atHour(LOG_HOUSE_ROOM_DAY_START_HOUR - 1, 59))).toBe("night");
  });
});

describe("resolveLogHouseRoomTimeOfDay", () => {
  it("respects fixed day and night preferences", () => {
    expect(resolveLogHouseRoomTimeOfDay("day", atHour(22))).toBe("day");
    expect(resolveLogHouseRoomTimeOfDay("night", atHour(10))).toBe("night");
  });

  it("uses local clock when preference is auto", () => {
    expect(resolveLogHouseRoomTimeOfDay("auto", atHour(10))).toBe("day");
    expect(resolveLogHouseRoomTimeOfDay("auto", atHour(20))).toBe("night");
  });
});

describe("normalizeLogHouseRoomTimeThemePreference", () => {
  it("defaults unknown values to auto", () => {
    expect(normalizeLogHouseRoomTimeThemePreference("nope")).toBe("auto");
    expect(normalizeLogHouseRoomTimeThemePreference("day")).toBe("day");
  });
});
