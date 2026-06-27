import { describe, expect, it } from "vitest";

import { wrapDailyNumberImageBody } from "./imageBodyWrap";

describe("wrapDailyNumberImageBody", () => {
  it("1行目は今日の空気は、までまとめ、以降13文字", () => {
    const text =
      "今日の「7」の空気は、あなたの深める力にやさしい静けさを添えてくれそうです。";
    const lines = wrapDailyNumberImageBody(text);
    expect(lines[0]?.text).toBe("今日の「7」の空気は、");
    expect(lines[1]?.text).toBe("あなたの深める力にやさしい");
    expect(lines[2]?.text).toBe("静けさを添えてくれそうです");
    expect(lines[3]?.text).toBe("。");
  });
});
