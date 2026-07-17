import { describe, expect, it } from "vitest";

import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { donguriReasonLabel, formatDonguriDelta } from "@/lib/loghouse/donguriTypes";

describe("donguriTypes / format", () => {
  it("maps reason labels for users", () => {
    expect(donguriReasonLabel("daily_delivery")).toBe("ヤギさん郵便");
    expect(donguriReasonLabel("admin_grant")).toBe("森からのおとどけ");
    expect(donguriReasonLabel("birthday_gift")).toBe("お誕生日のおとどけ");
    expect(donguriReasonLabel("adjustment")).toBe("森からの調整");
  });

  it("formats deltas", () => {
    expect(formatDonguriDelta(1)).toBe("+1");
    expect(formatDonguriDelta(-3)).toBe("-3");
  });

  it("uses Japan calendar dateKey", () => {
    expect(calendarDayKeyInJapanFromDate(new Date("2026-07-16T12:00:00+09:00"))).toBe(
      "2026-07-16",
    );
  });
});
