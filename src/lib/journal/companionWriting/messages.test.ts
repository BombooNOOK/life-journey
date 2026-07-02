import { describe, expect, it } from "vitest";

import { getAppraiserDisplayName } from "./messages";

describe("companionWriting messages", () => {
  it("鑑定士の表示名を返す", () => {
    expect(getAppraiserDisplayName("owl")).toBe("フクロウ先生");
    expect(getAppraiserDisplayName("frog")).toBe("ケロシオン");
  });
});
