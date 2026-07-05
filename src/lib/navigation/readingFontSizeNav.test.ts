import { describe, expect, it } from "vitest";

import {
  buildReadingFontSizePagePath,
  parseReadingFontSizeReturnTo,
  resolveSafeReadingFontSizeReturnTo,
} from "@/lib/navigation/readingFontSizeNav";

describe("readingFontSizeNav", () => {
  it("builds path with safe returnTo", () => {
    expect(buildReadingFontSizePagePath("/guide/first/ready")).toBe(
      "/settings/reading-font-size?returnTo=%2Fguide%2Ffirst%2Fready",
    );
  });

  it("rejects unsafe returnTo", () => {
    expect(parseReadingFontSizeReturnTo("//evil.example")).toBe("/");
    expect(parseReadingFontSizeReturnTo("https://evil.example")).toBe("/");
  });

  it("preserves query in returnTo", () => {
    expect(resolveSafeReadingFontSizeReturnTo("/guide/first/ready?step=1")).toBe(
      "/guide/first/ready?step=1",
    );
  });
});
