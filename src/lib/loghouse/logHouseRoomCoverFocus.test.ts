import { describe, expect, it } from "vitest";

import {
  resolveLogHouseRoomCoverFocus,
  shouldPinTourCardToTop,
} from "@/lib/loghouse/logHouseRoomCoverFocus";

describe("logHouseRoomCoverFocus", () => {
  it("pins mailbox to the bottom edge of the viewport", () => {
    const focus = resolveLogHouseRoomCoverFocus("mailbox");
    expect(focus).toEqual({ align: "bottom", xPct: expect.any(Number) });
    expect(focus!.xPct).toBeGreaterThan(10);
    expect(focus!.xPct).toBeLessThan(40);
    expect(shouldPinTourCardToTop("mailbox")).toBe(true);
  });

  it("keeps desk centered without pinning the tour card to the top", () => {
    const focus = resolveLogHouseRoomCoverFocus("desk");
    expect(focus?.align).toBe("center");
    expect(shouldPinTourCardToTop("desk")).toBe(false);
  });

  it("returns null when no spot", () => {
    expect(resolveLogHouseRoomCoverFocus(null)).toBeNull();
  });
});
