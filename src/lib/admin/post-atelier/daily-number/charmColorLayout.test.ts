import { describe, expect, it } from "vitest";

import { dailyNumberCharmColorSvgPosition } from "./charmColorLayout";

describe("dailyNumberCharmColorSvgPosition", () => {
  const cx = 470;
  const fontSize = 22;

  it("1文字基準の開始 x（Canva cx から半文字分左 + 8px 左寄せ）", () => {
    expect(dailyNumberCharmColorSvgPosition(cx, fontSize, "白")).toEqual({
      x: 451,
      textAnchor: "start",
    });
  });

  it("3文字も同じ開始 x（左揃え）", () => {
    expect(dailyNumberCharmColorSvgPosition(cx, fontSize, "ピンク")).toEqual({
      x: 451,
      textAnchor: "start",
    });
    expect(dailyNumberCharmColorSvgPosition(cx, fontSize, "橙・茶")).toEqual({
      x: 451,
      textAnchor: "start",
    });
  });

  it("上段 cx 485 でも同じルール", () => {
    expect(dailyNumberCharmColorSvgPosition(485, fontSize, "赤")).toEqual({
      x: 466,
      textAnchor: "start",
    });
  });
});
