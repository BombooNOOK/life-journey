import { describe, expect, it } from "vitest";

import { sanitizePdfBodyText } from "./sanitizeBodyText";

describe("sanitizePdfBodyText", () => {
  it("ソフトハイフンと ASCII ハイフンを除去する", () => {
    expect(sanitizePdfBodyText(`見本\u00ad文字`)).toBe("見本文字");
    expect(sanitizePdfBodyText("foo-bar")).toBe("foobar");
    expect(sanitizePdfBodyText("a\u00adb-c")).toBe("abc");
  });
});
