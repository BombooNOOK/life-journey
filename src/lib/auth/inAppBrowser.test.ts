import { describe, expect, it } from "vitest";

import { detectInAppBrowserLabel, inAppBrowserGoogleLoginWarning } from "./inAppBrowser";

describe("detectInAppBrowserLabel", () => {
  it("detects LINE in-app browser", () => {
    expect(
      detectInAppBrowserLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Line/14.0.0",
      ),
    ).toBe("LINE");
  });

  it("returns null for Safari on iPhone", () => {
    expect(
      detectInAppBrowserLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBeNull();
  });
});

describe("inAppBrowserGoogleLoginWarning", () => {
  it("builds warning for detected in-app browser", () => {
    expect(inAppBrowserGoogleLoginWarning("LINE")).toContain("Safari");
  });
});
