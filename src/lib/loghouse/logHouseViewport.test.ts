import { describe, expect, it } from "vitest";

import { isLogHouseMobileLikeViewport } from "./logHouseViewport";

describe("isLogHouseMobileLikeViewport", () => {
  it("treats narrow width as mobile", () => {
    expect(isLogHouseMobileLikeViewport(390, 844)).toBe(true);
    expect(isLogHouseMobileLikeViewport(1023, 900)).toBe(true);
  });

  it("treats short IDE panels as mobile even when wide", () => {
    expect(isLogHouseMobileLikeViewport(1200, 700)).toBe(true);
  });

  it("keeps tall desktop as PC layout", () => {
    expect(isLogHouseMobileLikeViewport(1280, 900)).toBe(false);
  });
});
