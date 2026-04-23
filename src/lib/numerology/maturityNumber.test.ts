import { describe, expect, it } from "vitest";

import { maturityNumberFromCore } from "./reduce";

describe("maturityNumberFromCore", () => {
  it("LP4 + D6 = 10 を 1 に縮約する", () => {
    expect(maturityNumberFromCore(4, 6)).toBe(1);
  });

  it("LP3 + D8 = 11 は保持する", () => {
    expect(maturityNumberFromCore(3, 8)).toBe(11);
  });

  it("LP22 + D11 = 33 はマスター扱いせず 6 に縮約する", () => {
    expect(maturityNumberFromCore(22, 11)).toBe(6);
  });
});
