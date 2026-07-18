import { describe, expect, it } from "vitest";

import {
  resolveLogHouseRoomCoverFocus,
  shouldPinTourCardToTop,
} from "@/lib/loghouse/logHouseRoomCoverFocus";

describe("logHouseRoomCoverFocus", () => {
  it("focuses mailbox in the lower half of the viewport", () => {
    const focus = resolveLogHouseRoomCoverFocus("mailbox");
    expect(focus).not.toBeNull();
    expect(focus!.yPct).toBeGreaterThan(80);
    expect(focus!.viewportYPct).toBeGreaterThan(50);
    expect(shouldPinTourCardToTop("mailbox")).toBe(true);
  });

  it("focuses desk without pinning the tour card to the top", () => {
    const focus = resolveLogHouseRoomCoverFocus("desk");
    expect(focus).not.toBeNull();
    expect(focus!.yPct).toBeGreaterThan(40);
    expect(focus!.yPct).toBeLessThan(60);
    expect(shouldPinTourCardToTop("desk")).toBe(false);
  });

  it("returns null when no spot", () => {
    expect(resolveLogHouseRoomCoverFocus(null)).toBeNull();
  });
});
