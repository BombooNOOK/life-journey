import { describe, expect, it } from "vitest";

import { isIOSSafariUserAgent } from "./isIOSSafari";

const iosSafariUa =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

describe("isIOSSafariUserAgent", () => {
  it("detects iPhone Safari", () => {
    expect(isIOSSafariUserAgent(iosSafariUa, "iPhone", 5)).toBe(true);
  });

  it("excludes Chrome on iOS", () => {
    expect(
      isIOSSafariUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
        "iPhone",
        5,
      ),
    ).toBe(false);
  });

  it("excludes desktop Chrome", () => {
    expect(
      isIOSSafariUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "MacIntel",
        0,
      ),
    ).toBe(false);
  });

  it("detects iPad with desktop UA via touch points", () => {
    expect(
      isIOSSafariUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "MacIntel",
        5,
      ),
    ).toBe(true);
  });
});
