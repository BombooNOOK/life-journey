import { describe, expect, it } from "vitest";

import { breakTitleAtCommaForPdf } from "./breakTitleAtComma";

describe("breakTitleAtCommaForPdf", () => {
  it("読点がなければそのまま", () => {
    expect(breakTitleAtCommaForPdf("短い")).toBe("短い");
    expect(breakTitleAtCommaForPdf("とても長いタイトルですが読点はありません")).toBe(
      "とても長いタイトルですが読点はありません",
    );
  });

  it("短くて読点があってもそのまま", () => {
    expect(breakTitleAtCommaForPdf("前、後")).toBe("前、後");
  });

  it("長くて読点が複数あるときは読点のあとで改行", () => {
    const long =
      "一二三四五六七八九十abcdefghij、二三五六七八九十bcdefghij、三四五六七八九十cdefghij";
    expect(long.length).toBeGreaterThan(20);
    const out = breakTitleAtCommaForPdf(long);
    expect(out).toContain("\n");
    expect(out.split("\n").length).toBe(3);
    expect(out).toMatch(/、\n/g);
  });
});
