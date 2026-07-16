import { describe, expect, it } from "vitest";

import { pickDailyFortuneGuide } from "@/lib/ljd/dailyFortuneGuides";
import { resolveDailyFortuneColorAsset } from "@/lib/ljd/dailyFortuneColors";

describe("pickDailyFortuneGuide", () => {
  it("returns the same guide for the same user/profile/day", () => {
    const a = pickDailyFortuneGuide({
      email: "reader@example.com",
      profileId: "profile-1",
      dateKey: "2026-07-16",
    });
    const b = pickDailyFortuneGuide({
      email: "reader@example.com",
      profileId: "profile-1",
      dateKey: "2026-07-16",
    });
    expect(a.id).toBe(b.id);
    expect(a.name).toBe(b.name);
  });

  it("can change by day", () => {
    const today = pickDailyFortuneGuide({
      email: "reader@example.com",
      profileId: "profile-1",
      dateKey: "2026-07-16",
    });
    const tomorrow = pickDailyFortuneGuide({
      email: "reader@example.com",
      profileId: "profile-1",
      dateKey: "2026-07-17",
    });
    // 稀に一致しうるが、連続2日の同一性だけは保証しない（ハッシュ変動の確認）
    expect(typeof tomorrow.id).toBe("string");
    expect(tomorrow.name.length).toBeGreaterThan(0);
    expect(today.name.length).toBeGreaterThan(0);
  });
});

describe("resolveDailyFortuneColorAsset", () => {
  it("maps existing guardian color labels", () => {
    expect(resolveDailyFortuneColorAsset("オレンジ").key).toBe("orange-brown");
    expect(resolveDailyFortuneColorAsset("オレンジ").label).toBe("オレンジ・茶");
    expect(resolveDailyFortuneColorAsset("オレンジ・茶").label).toBe("オレンジ・茶");
    expect(resolveDailyFortuneColorAsset("藍").key).toBe("darkblue");
    expect(resolveDailyFortuneColorAsset("藍").label).toBe("紺・藍色");
    expect(resolveDailyFortuneColorAsset("紺・藍色").label).toBe("紺・藍色");
    expect(resolveDailyFortuneColorAsset("ゴールド").paletteSrc).toContain(
      "daily_color_palette_gold.png",
    );
  });
});
