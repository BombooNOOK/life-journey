import { describe, expect, it } from "vitest";

import { buildBridgeNumbersFromCore, bridgeBetween } from "./compute";

describe("buildBridgeNumbersFromCore", () => {
  it("10 ペアをコアナンバーから算出する", () => {
    const b = buildBridgeNumbersFromCore({
      lifePath: 5,
      destiny: 3,
      soul: 2,
      personality: 4,
      birthday: 7,
    });
    expect(b.lifePathDestiny).toBe(bridgeBetween(5, 3));
    expect(b.lifePathSoul).toBe(bridgeBetween(5, 2));
    expect(b.lifePathPersonality).toBe(bridgeBetween(5, 4));
    expect(b.birthdayLifePath).toBe(bridgeBetween(7, 5));
    expect(b.destinySoul).toBe(bridgeBetween(3, 2));
    expect(b.destinyPersonality).toBe(bridgeBetween(3, 4));
    expect(b.destinyBirthday).toBe(bridgeBetween(3, 7));
    expect(b.soulPersonality).toBe(bridgeBetween(2, 4));
    expect(b.soulBirthday).toBe(bridgeBetween(2, 7));
    expect(b.personalityBirthday).toBe(bridgeBetween(4, 7));
  });

  it("名前由来が欠けるペアは null", () => {
    const b = buildBridgeNumbersFromCore({
      lifePath: 5,
      destiny: null,
      soul: null,
      personality: null,
      birthday: 7,
    });
    expect(b.lifePathDestiny).toBeNull();
    expect(b.lifePathSoul).toBeNull();
    expect(b.lifePathPersonality).toBeNull();
    expect(b.birthdayLifePath).not.toBeNull();
    expect(b.destinySoul).toBeNull();
    expect(b.destinyPersonality).toBeNull();
    expect(b.destinyBirthday).toBeNull();
    expect(b.soulPersonality).toBeNull();
    expect(b.soulBirthday).toBeNull();
    expect(b.personalityBirthday).toBeNull();
  });
});
