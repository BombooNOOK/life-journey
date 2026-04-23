import { describe, expect, it } from "vitest";

import { isHiraganaOnly } from "./hiragana";

describe("isHiraganaOnly", () => {
  it("ひらがなのみ true", () => {
    expect(isHiraganaOnly("やまだ")).toBe(true);
  });

  it("長音「ー」(U+30FC) を許可する", () => {
    expect(isHiraganaOnly("びりー")).toBe(true);
    expect(isHiraganaOnly("あーむ")).toBe(true);
  });

  it("英字・スペースは false", () => {
    expect(isHiraganaOnly("やまだa")).toBe(false);
    expect(isHiraganaOnly("や まだ")).toBe(false);
  });
});
