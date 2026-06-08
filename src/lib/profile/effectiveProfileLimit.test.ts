import { describe, expect, it } from "vitest";

import {
  effectiveProfileLimit,
  formatAdminEffectiveProfileLimitLabel,
  formatMyPageProfileLimitLabel,
  MONITOR_EFFECTIVE_PROFILE_LIMIT,
} from "@/lib/profile/effectiveProfileLimit";

describe("effectiveProfileLimit", () => {
  it("returns 3 when isMonitor is true regardless of stored profileLimit", () => {
    expect(effectiveProfileLimit({ isMonitor: true, profileLimit: 1 })).toBe(
      MONITOR_EFFECTIVE_PROFILE_LIMIT,
    );
    expect(effectiveProfileLimit({ isMonitor: true, profileLimit: 3 })).toBe(3);
  });

  it("returns stored profileLimit when not monitor", () => {
    expect(effectiveProfileLimit({ isMonitor: false, profileLimit: 3 })).toBe(3);
    expect(effectiveProfileLimit({ isMonitor: false, profileLimit: 1 })).toBe(1);
  });

  it("defaults to 1 when settings missing", () => {
    expect(effectiveProfileLimit(null)).toBe(1);
    expect(effectiveProfileLimit(undefined)).toBe(1);
    expect(effectiveProfileLimit({})).toBe(1);
  });

  it("formats my page label for monitor users", () => {
    expect(formatMyPageProfileLimitLabel({ isMonitor: true, profileLimit: 1 })).toBe(
      "3 プロフィール（モニター利用中）",
    );
    expect(formatMyPageProfileLimitLabel({ isMonitor: false, profileLimit: 1 })).toBe("1 プロフィール");
  });

  it("formats admin label for monitor users", () => {
    expect(formatAdminEffectiveProfileLimitLabel({ isMonitor: true, profileLimit: 1 })).toBe(
      "実効上限：3（モニター利用中）",
    );
    expect(formatAdminEffectiveProfileLimitLabel({ isMonitor: false, profileLimit: 1 })).toBe("1");
  });
});
