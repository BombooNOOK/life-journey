import { describe, expect, it } from "vitest";

import { formatCharmColorForImage } from "./charmColorDisplay";

describe("formatCharmColorForImage", () => {
  it("長い表記を画像用に短縮する", () => {
    expect(formatCharmColorForImage("オレンジ・茶色")).toBe("橙・茶");
    expect(formatCharmColorForImage("紺・藍色")).toBe("紺・藍");
    expect(formatCharmColorForImage("レインボー")).toBe("虹");
    expect(formatCharmColorForImage("黄色")).toBe("黄");
  });

  it("短い表記はそのまま", () => {
    expect(formatCharmColorForImage("赤")).toBe("赤");
    expect(formatCharmColorForImage("ゴールド")).toBe("ゴールド");
  });
});
