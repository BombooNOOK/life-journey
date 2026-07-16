import { describe, expect, it } from "vitest";

import { formatAccountMemberNumber } from "@/lib/account/accountMemberNumberFormat";

describe("formatAccountMemberNumber", () => {
  it("pads to 5 digits", () => {
    expect(formatAccountMemberNumber(1)).toBe("00001");
    expect(formatAccountMemberNumber(42)).toBe("00042");
    expect(formatAccountMemberNumber(12345)).toBe("12345");
  });

  it("returns dash for invalid", () => {
    expect(formatAccountMemberNumber(0)).toBe("—");
    expect(formatAccountMemberNumber(-1)).toBe("—");
  });
});
