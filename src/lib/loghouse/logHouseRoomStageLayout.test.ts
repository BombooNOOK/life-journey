import { describe, expect, it } from "vitest";

import { LOG_HOUSE_ROOM_MOBILE_INTRINSIC } from "@/lib/loghouse/logHouseRoomAssets";
import {
  logHouseRoomCoverCropRatio,
  resolveLogHouseRoomStageBoxStyle,
  shouldContainLogHouseRoomStage,
} from "@/lib/loghouse/logHouseRoomStageLayout";

const size = LOG_HOUSE_ROOM_MOBILE_INTRINSIC;

describe("logHouseRoomStageLayout", () => {
  it("keeps cover on tall phone-like viewports", () => {
    const box = { width: 390, height: 844 };
    expect(shouldContainLogHouseRoomStage(size, box)).toBe(false);
    expect(logHouseRoomCoverCropRatio(size, box)).toBeLessThanOrEqual(1.12);
  });

  it("switches to contain on short IDE / landscape panels", () => {
    const box = { width: 900, height: 560 };
    expect(shouldContainLogHouseRoomStage(size, box)).toBe(true);
    const style = resolveLogHouseRoomStageBoxStyle({
      size,
      box,
      mode: "contain",
    });
    expect(style.width).toBeLessThanOrEqual(box.width);
    expect(style.height).toBeLessThanOrEqual(box.height);
  });

  it("sizes cover from measured box instead of css viewport units", () => {
    const box = { width: 390, height: 700 };
    const style = resolveLogHouseRoomStageBoxStyle({
      size,
      box,
      mode: "cover",
      focus: null,
    });
    expect(style.width).toBe(Math.max(box.width, box.height * (size.widthPx / size.heightPx)));
    expect(style.height).toBe(Math.max(box.height, box.width / (size.widthPx / size.heightPx)));
  });

  it("does not transition width/height (avoids entry shake)", () => {
    const style = resolveLogHouseRoomStageBoxStyle({
      size,
      box: { width: 390, height: 844 },
      mode: "cover",
      focus: null,
    });
    const transition = String(style.transition ?? "");
    expect(transition).not.toMatch(/\bwidth\b/);
    expect(transition).not.toMatch(/\bheight\b/);
    expect(transition).toMatch(/transform/);
  });

  it("can disable pan transition for the first measured paint", () => {
    const style = resolveLogHouseRoomStageBoxStyle({
      size,
      box: { width: 390, height: 844 },
      mode: "cover",
      focus: null,
      animatePan: false,
    });
    expect(style.transition).toBeUndefined();
    expect(style.visibility).toBeUndefined();
  });

  it("hides unmeasured stage instead of animating from inset", () => {
    const style = resolveLogHouseRoomStageBoxStyle({
      size,
      box: { width: 0, height: 0 },
      mode: "cover",
    });
    expect(style.visibility).toBe("hidden");
    expect(style.transition).toBeUndefined();
  });
});
